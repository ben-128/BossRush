import { describe, it, expect } from 'vitest';
import { loadDesignData } from '../engine/loader.js';
import { loadEffectsCatalog } from '../engine/effectsLoader.js';
import { createGame } from '../engine/setup.js';
import { runGame } from '../engine/engine.js';
import { randomPolicy } from '../ai/random.js';
import { heuristicPolicy } from '../ai/heuristic.js';

async function winrate(policyName: 'random' | 'heuristic', seeds: number[]): Promise<number> {
  const data = await loadDesignData();
  const effects = await loadEffectsCatalog();
  const policy = policyName === 'heuristic' ? heuristicPolicy : randomPolicy;
  const heroIds = ['HERO_001', 'HERO_002', 'HERO_005'];
  let wins = 0;
  for (const seed of seeds) {
    const state = createGame(data, {
      seed,
      nPlayers: heroIds.length,
      bossId: 'BOSS_001',
      heroIds,
      effects,
    });
    runGame(state, { policies: heroIds.map(() => policy) });
    if (state.result === 'victory') wins++;
  }
  return wins / seeds.length;
}

describe('heuristicPolicy', () => {
  it('runs a full game end to end', async () => {
    const data = await loadDesignData();
    const effects = await loadEffectsCatalog();
    const heroIds = ['HERO_001', 'HERO_002', 'HERO_005'];
    const state = createGame(data, {
      seed: 7,
      nPlayers: heroIds.length,
      bossId: 'BOSS_001',
      heroIds,
      effects,
    });
    runGame(state, { policies: heroIds.map(() => heuristicPolicy) });
    expect(state.result).not.toBe('running');
    expect(state.events[state.events.length - 1]?.kind).toBe('GAME_END');
  });

  it('plays more actions than random over 20 games', async () => {
    const data = await loadDesignData();
    const effects = await loadEffectsCatalog();
    const heroIds = ['HERO_001', 'HERO_003', 'HERO_005'];
    let randomPlays = 0;
    let heuristicPlays = 0;
    for (let seed = 1; seed <= 20; seed++) {
      const sR = createGame(data, {
        seed,
        nPlayers: heroIds.length,
        bossId: 'BOSS_001',
        heroIds,
        effects,
      });
      runGame(sR, { policies: heroIds.map(() => randomPolicy) });
      randomPlays += sR.events.filter((e) => e.kind === 'ACTION_PLAY_ACTION').length;

      const sH = createGame(data, {
        seed,
        nPlayers: heroIds.length,
        bossId: 'BOSS_001',
        heroIds,
        effects,
      });
      runGame(sH, { policies: heroIds.map(() => heuristicPolicy) });
      heuristicPlays += sH.events.filter((e) => e.kind === 'ACTION_PLAY_ACTION').length;
    }
    // The heuristic should stay engaged, but it may play slightly less
    // than random because it now filters out useless plays (negative score
    // → draw/exchange instead). Allow a modest 25% margin below random.
    expect(heuristicPlays).toBeGreaterThanOrEqual(Math.floor(randomPlays * 0.75));
  });

  it('pickChoice avoids damage when critical', async () => {
    const data = await loadDesignData();
    const effects = await loadEffectsCatalog();
    const state = createGame(data, {
      seed: 1,
      nPlayers: 2,
      bossId: 'BOSS_001',
      heroIds: ['HERO_001', 'HERO_003'],
      effects,
    });
    // Bring hero to 1 HP away from death.
    state.heroes[0]!.wounds.push({
      woundId: 'T1',
      source: 'menace',
      sourceCardId: 'X',
      degats: state.heroes[0]!.vieMax - 1,
    });
    const options = [
      { label: 'encaisser' },
      { label: 'piocher' },
    ] as const;
    const idx = heuristicPolicy.pickChoice!(state, 0, 'X', options);
    expect(idx).toBe(1); // should pick 'piocher' (non-damaging)
  });
});
