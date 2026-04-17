#!/usr/bin/env tsx
/**
 * Smoke runner: play one game and print a compact summary + full event log.
 *
 * Usage:
 *   npx tsx src/cli/smoke.ts --boss BOSS_001 --heroes HERO_001,HERO_003,HERO_005 --seed 42
 *
 * Defaults are provided for quick iteration.
 */

import { loadDesignData } from '../engine/loader.js';
import { loadEffectsCatalog } from '../engine/effectsLoader.js';
import { createGame } from '../engine/setup.js';
import { runGame } from '../engine/engine.js';
import { randomPolicy } from '../ai/random.js';

interface Args {
  boss: string;
  heroes: string[];
  seed: string;
  quiet: boolean;
}

function parseArgs(): Args {
  const argv = process.argv.slice(2);
  const get = (flag: string, fallback: string): string => {
    const i = argv.indexOf(flag);
    if (i < 0) return fallback;
    return argv[i + 1] ?? fallback;
  };
  return {
    boss: get('--boss', 'BOSS_001'),
    heroes: get('--heroes', 'HERO_001,HERO_003,HERO_005').split(',').map((x) => x.trim()),
    seed: get('--seed', '42'),
    quiet: argv.includes('--quiet'),
  };
}

async function main(): Promise<void> {
  const args = parseArgs();
  const [data, effects] = await Promise.all([loadDesignData(), loadEffectsCatalog()]);

  const state = createGame(data, {
    seed: Number.isFinite(Number(args.seed)) ? Number(args.seed) : args.seed,
    nPlayers: args.heroes.length,
    bossId: args.boss,
    heroIds: args.heroes,
    effects,
  });

  const policies = args.heroes.map(() => randomPolicy);
  runGame(state, { policies });

  if (!args.quiet) {
    for (const ev of state.events) {
      // eslint-disable-next-line no-console
      console.log(JSON.stringify(ev));
    }
  }

  // Summary to stderr so stdout stays JSONL-clean.
  const eventCounts = state.events.reduce<Record<string, number>>((acc, e) => {
    acc[e.kind] = (acc[e.kind] ?? 0) + 1;
    return acc;
  }, {});

  process.stderr.write(
    `\n[summary] boss=${args.boss} heroes=[${args.heroes.join(',')}] seed=${args.seed}\n`,
  );
  process.stderr.write(
    `[summary] result=${state.result} turns=${state.turn} events=${state.events.length}\n`,
  );
  process.stderr.write(
    `[summary] deadHeroes=${state.heroes.filter((h) => h.dead).length}/${state.nPlayers}\n`,
  );
  const bossDmg = state.boss.wounds.reduce((s, w) => s + w.degats, 0);
  process.stderr.write(
    `[summary] bossHp=${state.boss.vieMax - bossDmg}/${state.boss.vieMax}\n`,
  );
  process.stderr.write(`[summary] eventCounts=${JSON.stringify(eventCounts)}\n`);
}

main().catch((err) => {
  // eslint-disable-next-line no-console
  console.error('[smoke] FAILED:', err);
  process.exit(1);
});
