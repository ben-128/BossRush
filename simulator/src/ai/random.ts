/**
 * Random policy — picks a legal action uniformly at random.
 *
 * J2 behavior:
 *  - If at least one playable Action card is in hand that meets prerequisite,
 *    pick one at random to play. If pure-renfort objets posés are available,
 *    attach them with small probability.
 *  - Otherwise, draw.
 *  - Never exchanges (exchange not implemented in J2).
 *  - Never uses Capacité Spéciale (not implemented in J2).
 *
 * This is a baseline policy — deliberately naive. Better heuristics come
 * later (see §12 of simulator_plan.md).
 */

import type { GameState, HeroRuntime } from '../engine/gameState.js';
import { Rng } from '../engine/rng.js';
import type { PlayerAction } from '../engine/actions.js';
import {
  isActionPlayable,
  isObjetPlayableRenfort,
  meetsPrerequisite,
} from '../engine/actions.js';

export interface Policy {
  name: string;
  pickAction(state: GameState): PlayerAction;
}

function withRng<T>(state: GameState, fn: (rng: Rng) => T): T {
  const rng = Rng.fromState(state.rngState);
  const result = fn(rng);
  state.rngState = rng.state;
  return result;
}

function playableActionIndices(state: GameState, h: HeroRuntime): number[] {
  const out: number[] = [];
  h.hand.forEach((c, i) => {
    if (isActionPlayable(state, c) && meetsPrerequisite(h, c, state)) out.push(i);
  });
  return out;
}

function renfortObjectIndices(state: GameState, h: HeroRuntime): number[] {
  const out: number[] = [];
  h.objects.forEach((c, i) => {
    if (isObjetPlayableRenfort(state, c)) out.push(i);
  });
  return out;
}

export const randomPolicy: Policy = {
  name: 'random',
  pickAction(state: GameState): PlayerAction {
    const h = state.heroes[state.activeSeat];
    if (!h) return { kind: 'none', reason: 'no active hero' };

    const playable = playableActionIndices(state, h);

    // Small chance to fire the capacité spéciale if available and coded.
    if (!h.capaciteUsed && state.effects[h.heroId]) {
      const roll = withRng(state, (rng) => rng.nextFloat());
      if (roll < 0.1) return { kind: 'useCapacite' };
    }

    if (playable.length === 0) {
      return { kind: 'draw' };
    }

    return withRng(state, (rng) => {
      const handIdx = rng.pick(playable);
      const renforts = renfortObjectIndices(state, h);
      // 50% chance to add one renfort, 25% to add two, 25% none, capped.
      const decision = rng.nextFloat();
      const chosenRenforts: number[] = [];
      if (renforts.length > 0 && decision < 0.75) {
        const nToUse = decision < 0.25 ? Math.min(renforts.length, 2) : 1;
        // Pick `nToUse` distinct indices.
        const shuffled = rng.shuffle(renforts);
        chosenRenforts.push(...shuffled.slice(0, nToUse));
      }
      return {
        kind: 'play',
        playAction: handIdx,
        renforts: chosenRenforts,
      };
    });
  },
};
