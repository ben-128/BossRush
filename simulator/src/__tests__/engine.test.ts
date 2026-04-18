import { describe, it, expect } from 'vitest';
import { loadDesignData } from '../engine/loader.js';
import { createGame } from '../engine/setup.js';
import { runGame } from '../engine/engine.js';
import { applyPlayerAction } from '../engine/actions.js';
import { randomPolicy } from '../ai/random.js';

async function runOneGame(opts: {
  seed: number | string;
  bossId: string;
  heroIds: string[];
}) {
  const data = await loadDesignData();
  const state = createGame(data, {
    seed: opts.seed,
    nPlayers: opts.heroIds.length,
    bossId: opts.bossId,
    heroIds: opts.heroIds,
  });
  const policies = opts.heroIds.map(() => randomPolicy);
  await runGame(state, { policies });
  return state;
}

describe('engine / full game smoke', () => {
  it('runs a 3-player game against Hobab and terminates', async () => {
    const state = await runOneGame({
      seed: 42,
      bossId: 'BOSS_001',
      heroIds: ['HERO_001', 'HERO_003', 'HERO_005'],
    });
    expect(['victory', 'defeat']).toContain(state.result);
    const endEvent = state.events[state.events.length - 1];
    expect(endEvent?.kind).toBe('GAME_END');
    // Some activity happened.
    const hasTurnStart = state.events.some((e) => e.kind === 'TURN_START');
    expect(hasTurnStart).toBe(true);
  });

  it('is deterministic for identical seeds', async () => {
    const a = await runOneGame({
      seed: 'reproducible',
      bossId: 'BOSS_003',
      heroIds: ['HERO_002', 'HERO_004'],
    });
    const b = await runOneGame({
      seed: 'reproducible',
      bossId: 'BOSS_003',
      heroIds: ['HERO_002', 'HERO_004'],
    });
    expect(a.result).toBe(b.result);
    expect(a.turn).toBe(b.turn);
    expect(a.events.length).toBe(b.events.length);
    // Event types match position-by-position.
    for (let i = 0; i < a.events.length; i++) {
      expect(a.events[i]?.kind).toBe(b.events[i]?.kind);
    }
  });

  it('produces different outcomes across different seeds (usually)', async () => {
    const results: string[] = [];
    for (let s = 1; s <= 20; s++) {
      const state = await runOneGame({
        seed: s,
        bossId: 'BOSS_001',
        heroIds: ['HERO_001', 'HERO_003', 'HERO_005'],
      });
      results.push(`${state.result}:${state.turn}`);
    }
    const uniq = new Set(results);
    // We don't expect 20 unique outcomes, but the set should be > 1.
    expect(uniq.size).toBeGreaterThan(1);
  });

  it('exchange action swaps cards between two hero hands', async () => {
    const data = await loadDesignData();
    const state = createGame(data, {
      seed: 1,
      nPlayers: 2,
      bossId: 'BOSS_001',
      heroIds: ['HERO_001', 'HERO_003'],
    });
    const heroA = state.heroes[0]!;
    const heroB = state.heroes[1]!;
    const aNom = state.catalog.heroesById.get(heroA.heroId)!.nom;
    const bNom = state.catalog.heroesById.get(heroB.heroId)!.nom;

    // Force compatible hands so the prereq gate doesn't reject the exchange:
    // heroA holds a card whose prereq matches heroB, and vice versa.
    const aCard = data.cartesChasse.find((c) => c.prerequis === bNom)!;
    const bCard = data.cartesChasse.find((c) => c.prerequis === aNom)!;
    heroA.hand = [aCard];
    heroB.hand = [bCard];

    await applyPlayerAction(state, {
      kind: 'exchange',
      withSeat: 1,
      give: [0],
      take: [0],
    });

    expect(heroA.hand.length).toBe(1);
    expect(heroB.hand.length).toBe(1);
    expect(heroA.hand[0]!.id).toBe(bCard.id);
    expect(heroB.hand[0]!.id).toBe(aCard.id);

    const last = state.events[state.events.length - 1]!;
    expect(last.kind).toBe('ACTION_EXCHANGE');
  });

  it('exchange is rejected if partner is dead or same seat', async () => {
    const data = await loadDesignData();
    const state = createGame(data, {
      seed: 1,
      nPlayers: 2,
      bossId: 'BOSS_001',
      heroIds: ['HERO_001', 'HERO_003'],
    });
    // Kill partner manually.
    state.heroes[1]!.dead = true;
    await applyPlayerAction(state, { kind: 'exchange', withSeat: 1, give: [0], take: [0] });
    let last = state.events[state.events.length - 1]!;
    expect(last.kind).toBe('ACTION_NONE');

    state.heroes[1]!.dead = false;
    await applyPlayerAction(state, { kind: 'exchange', withSeat: 0, give: [0], take: [0] });
    last = state.events[state.events.length - 1]!;
    expect(last.kind).toBe('ACTION_NONE');
  });

  it('smoke-runs against every boss with random heroes', async () => {
    const data = await loadDesignData();
    const heroIds = ['HERO_001', 'HERO_003', 'HERO_005'];
    for (const b of data.boss) {
      const state = createGame(data, {
        seed: `smoke-${b.id}`,
        nPlayers: heroIds.length,
        bossId: b.id,
        heroIds,
      });
      const policies = heroIds.map(() => randomPolicy);
      await runGame(state, { policies });
      expect(state.result).not.toBe('running');
    }
  });
});
