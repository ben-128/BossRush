#!/usr/bin/env tsx
/**
 * Batch runner.
 *
 * Usage:
 *   npm run sim -- --runs 100 --boss BOSS_001 --heroes random \
 *       --policy heuristic --choicePolicy heuristic \
 *       --keepLogs all --out logs/batch_001
 *
 * Flags:
 *   --runs N           number of games (default 100)
 *   --boss ID|random   boss id or 'random' (default BOSS_001)
 *   --players N        number of players 2-5 (default 3)
 *   --heroes CSV|random hero ids or 'random' (default random per game)
 *   --policy name      'random' | 'heuristic' (default 'heuristic')
 *   --choicePolicy n   'random' | 'heuristic' (default matches --policy)
 *   --seedStart N      starting seed (default 1)
 *   --out DIR          output directory (default logs/batch_<timestamp>)
 *   --keepLogs mode    'none' | 'all' | 'anomalies' (default 'all')
 *   --verbose          print progress to stderr
 *
 * Outputs in --out:
 *   summary.csv         1 line per game (seed, heroes, boss, result, turns, …)
 *   stats.json          aggregates
 *   games/NNNNN_seedXXXXX.jsonl  per-game event streams (depending on keepLogs)
 */

import { mkdir, writeFile } from 'node:fs/promises';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

import { loadDesignData } from '../engine/loader.js';
import { loadEffectsCatalog } from '../engine/effectsLoader.js';
import { createGame } from '../engine/setup.js';
import { runGame } from '../engine/engine.js';
import { Rng } from '../engine/rng.js';
import { randomPolicy } from '../ai/random.js';
import { heuristicPolicy } from '../ai/heuristic.js';
import type { Policy } from '../ai/policy.js';
import type { DesignData } from '../engine/types.js';

const __dirname = dirname(fileURLToPath(import.meta.url));
const SIM_ROOT = resolve(__dirname, '..', '..');

interface Args {
  runs: number;
  boss: string;
  players: number;
  heroes: string | 'random';
  policy: 'random' | 'heuristic';
  choicePolicy: 'random' | 'heuristic';
  seedStart: number;
  out: string;
  keepLogs: 'none' | 'all' | 'anomalies';
  verbose: boolean;
}

function parseArgs(): Args {
  const argv = process.argv.slice(2);
  const get = (flag: string, fallback: string): string => {
    const i = argv.indexOf(flag);
    if (i < 0) return fallback;
    return argv[i + 1] ?? fallback;
  };
  const ts = new Date().toISOString().replace(/[:.]/g, '-');
  return {
    runs: parseInt(get('--runs', '100'), 10),
    boss: get('--boss', 'BOSS_001'),
    players: parseInt(get('--players', '3'), 10),
    heroes: get('--heroes', 'random'),
    policy: get('--policy', 'heuristic') as 'random' | 'heuristic',
    choicePolicy: get('--choicePolicy', 'heuristic') as 'random' | 'heuristic',
    seedStart: parseInt(get('--seedStart', '1'), 10),
    out: get('--out', join(SIM_ROOT, 'logs', `batch_${ts}`)),
    keepLogs: get('--keepLogs', 'all') as 'none' | 'all' | 'anomalies',
    verbose: argv.includes('--verbose'),
  };
}

function pickPolicy(name: 'random' | 'heuristic'): Policy {
  return name === 'heuristic' ? heuristicPolicy : randomPolicy;
}

function pickRandomHeroes(rng: Rng, data: DesignData, n: number): string[] {
  const ids = data.heroes.map((h) => h.id);
  return rng.shuffle(ids).slice(0, n);
}

function pickRandomBoss(rng: Rng, data: DesignData): string {
  return rng.pick(data.boss.map((b) => b.id));
}

function csvEscape(v: string | number): string {
  const s = String(v);
  if (/[",\n]/.test(s)) return `"${s.replace(/"/g, '""')}"`;
  return s;
}

async function main(): Promise<void> {
  const args = parseArgs();
  const [data, effects] = await Promise.all([loadDesignData(), loadEffectsCatalog()]);

  const outDir = args.out;
  const gamesDir = join(outDir, 'games');
  await mkdir(outDir, { recursive: true });
  if (args.keepLogs !== 'none') await mkdir(gamesDir, { recursive: true });

  const rows: string[] = [];
  rows.push(
    ['seed', 'boss', 'heroes', 'nPlayers', 'result', 'turns', 'bossHpRemaining', 'deadHeroes', 'events'].join(','),
  );

  const startedAt = Date.now();
  let wins = 0;
  let defeats = 0;
  let sumTurns = 0;
  const turnsPerResult: { victory: number[]; defeat: number[] } = { victory: [], defeat: [] };
  const cardPlayCount: Record<string, number> = {};
  const bossPerSeed: Record<string, { wins: number; defeats: number }> = {};
  const heroPerSeed: Record<string, { games: number; deaths: number }> = {};

  const basePolicy = pickPolicy(args.policy);
  // choicePolicy only affects pickChoice handler — we wrap.
  const policies: Policy[] = [];
  for (let p = 0; p < args.players; p++) {
    const main = basePolicy;
    const choiceSrc = pickPolicy(args.choicePolicy);
    policies.push({
      name: `${main.name}+choice=${choiceSrc.name}`,
      pickAction: (s) => main.pickAction(s),
      ...(choiceSrc.pickChoice && { pickChoice: choiceSrc.pickChoice.bind(choiceSrc) }),
      ...(main.pickHeroTarget && { pickHeroTarget: main.pickHeroTarget.bind(main) }),
      ...(main.pickMonsterTarget && { pickMonsterTarget: main.pickMonsterTarget.bind(main) }),
    });
  }

  for (let i = 0; i < args.runs; i++) {
    const seed = args.seedStart + i;
    // Setup RNG separately for hero/boss randomisation to not affect game seed.
    const pickRng = new Rng(`pick-${seed}`);
    const heroIds =
      args.heroes === 'random'
        ? pickRandomHeroes(pickRng, data, args.players)
        : args.heroes.split(',').map((x) => x.trim()).slice(0, args.players);
    const bossId = args.boss === 'random' ? pickRandomBoss(pickRng, data) : args.boss;

    const state = createGame(data, {
      seed,
      nPlayers: heroIds.length,
      bossId,
      heroIds,
      effects,
    });
    runGame(state, { policies: policies.slice(0, heroIds.length) });

    const bossHp =
      state.boss.vieMax - state.boss.wounds.reduce((s, w) => s + w.degats, 0);
    const deadSeats = state.heroes.filter((h) => h.dead).map((h) => h.seatIdx);

    if (state.result === 'victory') wins++;
    else defeats++;
    sumTurns += state.turn;
    turnsPerResult[state.result === 'victory' ? 'victory' : 'defeat'].push(state.turn);

    // Card play counts.
    for (const ev of state.events) {
      if (ev.kind === 'ACTION_PLAY_ACTION' || ev.kind === 'ACTION_PLAY_OBJECT') {
        cardPlayCount[ev.card] = (cardPlayCount[ev.card] ?? 0) + 1;
      }
    }

    const bk = bossPerSeed[bossId] ?? (bossPerSeed[bossId] = { wins: 0, defeats: 0 });
    if (state.result === 'victory') bk.wins++;
    else bk.defeats++;

    for (const hid of heroIds) {
      const hk = heroPerSeed[hid] ?? (heroPerSeed[hid] = { games: 0, deaths: 0 });
      hk.games++;
      const h = state.heroes.find((x) => x.heroId === hid);
      if (h?.dead) hk.deaths++;
    }

    rows.push(
      [
        seed,
        bossId,
        heroIds.join('|'),
        heroIds.length,
        state.result,
        state.turn,
        bossHp,
        deadSeats.join('|'),
        state.events.length,
      ]
        .map((v) => csvEscape(String(v)))
        .join(','),
    );

    const anomalous = state.turn <= 5 || state.turn >= state.turnCap - 1;
    const keep = args.keepLogs === 'all' || (args.keepLogs === 'anomalies' && anomalous);
    if (keep) {
      const fname = `${String(i + 1).padStart(5, '0')}_seed${String(seed).padStart(6, '0')}.jsonl`;
      const payload = state.events.map((ev) => JSON.stringify(ev)).join('\n') + '\n';
      await writeFile(join(gamesDir, fname), payload, 'utf-8');
    }

    if (args.verbose && (i + 1) % 10 === 0) {
      process.stderr.write(
        `[batch] ${i + 1}/${args.runs} (wins=${wins}, defeats=${defeats})\n`,
      );
    }
  }

  const stats = {
    config: args,
    runs: args.runs,
    winrate: wins / args.runs,
    wins,
    defeats,
    meanTurns: sumTurns / args.runs,
    meanTurnsVictory:
      turnsPerResult.victory.length > 0
        ? turnsPerResult.victory.reduce((s, x) => s + x, 0) / turnsPerResult.victory.length
        : null,
    meanTurnsDefeat:
      turnsPerResult.defeat.length > 0
        ? turnsPerResult.defeat.reduce((s, x) => s + x, 0) / turnsPerResult.defeat.length
        : null,
    byBoss: Object.fromEntries(
      Object.entries(bossPerSeed).map(([k, v]) => [
        k,
        { ...v, winrate: v.wins / (v.wins + v.defeats) },
      ]),
    ),
    byHero: Object.fromEntries(
      Object.entries(heroPerSeed).map(([k, v]) => [
        k,
        { ...v, deathRate: v.deaths / Math.max(1, v.games) },
      ]),
    ),
    topPlayedCards: Object.entries(cardPlayCount)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 20),
    durationMs: Date.now() - startedAt,
  };

  await writeFile(join(outDir, 'summary.csv'), rows.join('\n') + '\n', 'utf-8');
  await writeFile(join(outDir, 'stats.json'), JSON.stringify(stats, null, 2), 'utf-8');

  process.stderr.write(
    `[batch] done. ${args.runs} runs in ${stats.durationMs}ms. winrate=${(stats.winrate * 100).toFixed(1)}%. out=${outDir}\n`,
  );
}

main().catch((err) => {
  console.error('[batch] FAILED:', err);
  process.exit(1);
});
