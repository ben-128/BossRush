/**
 * Shared batch runner — no filesystem, no CLI concerns.
 *
 * Used by both `cli/batch.ts` (writes results to disk) and the UI's Batch
 * panel (lets the user download files from the browser). Pure function over
 * `DesignData + EffectsCatalog + options`.
 */

import type { DesignData } from '../engine/types.js';
import type { EffectsCatalog } from '../engine/effectTypes.js';
import type { GameEvent } from '../engine/events.js';
import { createGame } from '../engine/setup.js';
import { runGame } from '../engine/engine.js';
import { Rng } from '../engine/rng.js';
import { randomPolicy } from '../ai/random.js';
import { heuristicPolicy } from '../ai/heuristic.js';
import type { Policy } from '../ai/policy.js';

export interface BatchOptions {
  runs: number;
  /** Boss id, or 'random'. */
  boss: string;
  /** 2-5, or 'all' = run each of [2,3,4,5] with `runs` games. */
  players: number | 'all';
  /** Hero ids csv, or 'random'. */
  heroes: string | 'random';
  policy: 'random' | 'heuristic';
  choicePolicy: 'random' | 'heuristic';
  seedStart: number;
  /** If true, keep each game's event log in memory (needed for browser
   *  downloads / replay). Off by default for large batches. */
  keepEvents: boolean;
}

export interface BatchRow {
  seed: number | string;
  boss: string;
  heroes: string[];
  nPlayers: number;
  result: 'victory' | 'defeat';
  turns: number;
  bossHpRemaining: number;
  deadHeroes: number[];
  events: number;
  /** Only present when keepEvents=true. */
  eventLog?: GameEvent[];
}

export interface BatchStats {
  config: BatchOptions;
  runs: number;
  wins: number;
  defeats: number;
  winrate: number;
  meanTurns: number;
  meanTurnsVictory: number | null;
  meanTurnsDefeat: number | null;
  byBoss: Record<string, { wins: number; defeats: number; winrate: number }>;
  byHero: Record<string, { games: number; wins: number; winrate: number }>;
  byPlayerCount: Record<number, { runs: number; wins: number; defeats: number; winrate: number }>;
  actionMix: {
    total: number;
    play: number;
    playObject: number;
    objectRenfort: number;
    objectActive: number;
    draw: number;
    exchange: number;
    useCapacite: number;
  };
  /** Average capacité uses per hero per game, overall and keyed by heroId. */
  capaciteStats: {
    avgPerHeroPerGame: number;
    byHero: Record<string, { uses: number; games: number; avgPerGame: number }>;
  };
  /** Per-object usage breakdown (card id → count by kind). */
  objectStats: Record<string, { posed: number; renfort: number; active: number }>;
  /** Least-played chasse cards (id, count) — count = 0 if never played. */
  leastPlayedCards: Array<[string, number]>;
  durationMs: number;
}

export interface BatchResult {
  rows: BatchRow[];
  stats: BatchStats;
}

function pickPolicy(name: 'random' | 'heuristic'): Policy {
  return name === 'heuristic' ? heuristicPolicy : randomPolicy;
}

function buildPolicies(opts: BatchOptions, nSeats: number): Policy[] {
  const main = pickPolicy(opts.policy);
  const choiceSrc = pickPolicy(opts.choicePolicy);
  const policies: Policy[] = [];
  for (let p = 0; p < nSeats; p++) {
    policies.push({
      name: `${main.name}+choice=${choiceSrc.name}`,
      pickAction: (s) => main.pickAction(s),
      ...(main.pickReaction && { pickReaction: main.pickReaction.bind(main) }),
      ...(choiceSrc.pickChoice && { pickChoice: choiceSrc.pickChoice.bind(choiceSrc) }),
      ...(main.pickHeroTarget && { pickHeroTarget: main.pickHeroTarget.bind(main) }),
      ...(main.pickMonsterTarget && { pickMonsterTarget: main.pickMonsterTarget.bind(main) }),
    });
  }
  return policies;
}

/** Run a batch. Returns rows + aggregated stats. Async because the engine is async. */
export async function runBatch(
  data: DesignData,
  effects: EffectsCatalog,
  opts: BatchOptions,
  onProgress?: (done: number, total: number) => void,
): Promise<BatchResult> {
  const startedAt = Date.now();
  const rows: BatchRow[] = [];
  let wins = 0;
  let defeats = 0;
  let sumTurns = 0;
  const turnsPerResult: { victory: number[]; defeat: number[] } = { victory: [], defeat: [] };
  const cardPlayCount: Record<string, number> = {};
  const actionMix = { play: 0, playObject: 0, objectRenfort: 0, objectActive: 0, draw: 0, exchange: 0, useCapacite: 0 };
  const capaciteByHero: Record<string, { uses: number; games: number }> = {};
  const objectByCard: Record<string, { posed: number; renfort: number; active: number }> = {};
  const bumpObj = (cardId: string, kind: 'posed' | 'renfort' | 'active') => {
    const b = objectByCard[cardId] ?? (objectByCard[cardId] = { posed: 0, renfort: 0, active: 0 });
    b[kind]++;
  };
  const bossAgg: Record<string, { wins: number; defeats: number }> = {};
  const heroAgg: Record<string, { games: number; wins: number }> = {};
  const playerCountAgg: Record<number, { runs: number; wins: number; defeats: number }> = {};

  const playerCounts: number[] = opts.players === 'all' ? [2, 3, 4, 5] : [opts.players];
  const maxSeats = Math.max(...playerCounts);
  const policies = buildPolicies(opts, maxSeats);
  const totalRuns = opts.runs * playerCounts.length;
  let globalIdx = 0;

  for (const nPlayers of playerCounts) {
  for (let i = 0; i < opts.runs; i++) {
    const seed = opts.seedStart + i + nPlayers * 1000000;
    const pickRng = new Rng(`pick-${seed}`);
    const heroIds =
      opts.heroes === 'random'
        ? pickRng.shuffle(data.heroes.map((h) => h.id)).slice(0, nPlayers)
        : opts.heroes.split(',').map((x) => x.trim()).slice(0, nPlayers);
    const bossId = opts.boss === 'random' ? pickRng.pick(data.boss.map((b) => b.id)) : opts.boss;

    const state = createGame(data, {
      seed,
      nPlayers: heroIds.length,
      bossId,
      heroIds,
      effects,
    });
    await runGame(state, { policies: policies.slice(0, heroIds.length) });

    const bossHp =
      state.boss.vieMax - state.boss.wounds.reduce((s, w) => s + w.degats, 0);
    const deadSeats = state.heroes.filter((h) => h.dead).map((h) => h.seatIdx);
    const result = state.result === 'victory' ? 'victory' : 'defeat';

    if (result === 'victory') wins++;
    else defeats++;
    sumTurns += state.turn;
    turnsPerResult[result].push(state.turn);

    for (const ev of state.events) {
      if (ev.kind === 'ACTION_PLAY_ACTION') {
        cardPlayCount[ev.card] = (cardPlayCount[ev.card] ?? 0) + 1;
        actionMix.play++;
        // Each renfort attached = 1 object used as renfort.
        actionMix.objectRenfort += ev.renforts.length;
        for (const r of ev.renforts) {
          cardPlayCount[r] = (cardPlayCount[r] ?? 0) + 1;
          bumpObj(r, 'renfort');
        }
      } else if (ev.kind === 'ACTION_PLAY_OBJECT') {
        cardPlayCount[ev.card] = (cardPlayCount[ev.card] ?? 0) + 1;
        actionMix.playObject++;
        bumpObj(ev.card, 'posed');
      } else if (ev.kind === 'ACTION_DRAW') {
        actionMix.draw++;
      } else if (ev.kind === 'ACTION_EXCHANGE') {
        actionMix.exchange++;
      } else if (ev.kind === 'CAPACITE_USED') {
        actionMix.useCapacite++;
        const bucket = capaciteByHero[ev.heroId] ?? (capaciteByHero[ev.heroId] = { uses: 0, games: 0 });
        bucket.uses++;
      } else if (ev.kind === 'OBJECT_USED') {
        actionMix.objectActive++;
        cardPlayCount[ev.card] = (cardPlayCount[ev.card] ?? 0) + 1;
        bumpObj(ev.card, 'active');
      }
    }
    // Track game participation for each hero (for per-game averages).
    for (const hid of heroIds) {
      const bucket = capaciteByHero[hid] ?? (capaciteByHero[hid] = { uses: 0, games: 0 });
      bucket.games++;
    }

    const bk = bossAgg[bossId] ?? (bossAgg[bossId] = { wins: 0, defeats: 0 });
    if (result === 'victory') bk.wins++;
    else bk.defeats++;

    const pk =
      playerCountAgg[nPlayers] ?? (playerCountAgg[nPlayers] = { runs: 0, wins: 0, defeats: 0 });
    pk.runs++;
    if (result === 'victory') pk.wins++;
    else pk.defeats++;

    for (const hid of heroIds) {
      const hk = heroAgg[hid] ?? (heroAgg[hid] = { games: 0, wins: 0 });
      hk.games++;
      if (result === 'victory') hk.wins++;
    }

    const row: BatchRow = {
      seed,
      boss: bossId,
      heroes: heroIds,
      nPlayers: heroIds.length,
      result,
      turns: state.turn,
      bossHpRemaining: bossHp,
      deadHeroes: deadSeats,
      events: state.events.length,
      ...(opts.keepEvents && { eventLog: state.events.slice() }),
    };
    rows.push(row);

    globalIdx++;
    if (onProgress && globalIdx % Math.max(1, Math.floor(totalRuns / 20)) === 0) {
      onProgress(globalIdx, totalRuns);
    }
  }
  }

  const stats: BatchStats = {
    config: opts,
    runs: totalRuns,
    wins,
    defeats,
    winrate: wins / Math.max(1, totalRuns),
    meanTurns: sumTurns / Math.max(1, totalRuns),
    meanTurnsVictory:
      turnsPerResult.victory.length > 0
        ? turnsPerResult.victory.reduce((s, x) => s + x, 0) / turnsPerResult.victory.length
        : null,
    meanTurnsDefeat:
      turnsPerResult.defeat.length > 0
        ? turnsPerResult.defeat.reduce((s, x) => s + x, 0) / turnsPerResult.defeat.length
        : null,
    byBoss: Object.fromEntries(
      Object.entries(bossAgg).map(([k, v]) => [
        k,
        { ...v, winrate: v.wins / Math.max(1, v.wins + v.defeats) },
      ]),
    ),
    byHero: Object.fromEntries(
      Object.entries(heroAgg).map(([k, v]) => [
        k,
        { ...v, winrate: v.wins / Math.max(1, v.games) },
      ]),
    ),
    byPlayerCount: Object.fromEntries(
      Object.entries(playerCountAgg).map(([k, v]) => [
        Number(k),
        { ...v, winrate: v.wins / Math.max(1, v.runs) },
      ]),
    ),
    leastPlayedCards: data.cartesChasse
      .map((c) => [c.id, cardPlayCount[c.id] ?? 0] as [string, number])
      .sort((a, b) => a[1] - b[1])
      .slice(0, 10),
    actionMix: (() => {
      const total =
        actionMix.play + actionMix.playObject + actionMix.draw + actionMix.exchange + actionMix.useCapacite;
      return { total, ...actionMix };
    })(),
    objectStats: (() => {
      // Include every objet from the catalog so unused ones show up with 0s.
      const out: Record<string, { posed: number; renfort: number; active: number }> = {};
      for (const c of data.cartesChasse) {
        if (c.categorie !== 'objet') continue;
        out[c.id] = objectByCard[c.id] ?? { posed: 0, renfort: 0, active: 0 };
      }
      return out;
    })(),
    capaciteStats: (() => {
      let totalUses = 0;
      let totalSlots = 0;
      const byHero: Record<string, { uses: number; games: number; avgPerGame: number }> = {};
      for (const [hid, v] of Object.entries(capaciteByHero)) {
        totalUses += v.uses;
        totalSlots += v.games;
        byHero[hid] = { ...v, avgPerGame: v.uses / Math.max(1, v.games) };
      }
      return {
        avgPerHeroPerGame: totalSlots > 0 ? totalUses / totalSlots : 0,
        byHero,
      };
    })(),
    durationMs: Date.now() - startedAt,
  };

  return { rows, stats };
}

/** Render a batch result as CSV (1 line per game). */
export function rowsToCsv(rows: ReadonlyArray<BatchRow>): string {
  const header = ['seed', 'boss', 'heroes', 'nPlayers', 'result', 'turns', 'bossHpRemaining', 'deadHeroes', 'events'];
  const esc = (s: string) => (/[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s);
  const lines = [header.join(',')];
  for (const r of rows) {
    lines.push(
      [
        r.seed,
        r.boss,
        r.heroes.join('|'),
        r.nPlayers,
        r.result,
        r.turns,
        r.bossHpRemaining,
        r.deadHeroes.join('|'),
        r.events,
      ]
        .map((v) => esc(String(v)))
        .join(','),
    );
  }
  return lines.join('\n') + '\n';
}
