/**
 * Policy interface shared by all AIs.
 *
 * Required:
 *  - pickAction(state): chooses the main turn action (Draw/Play/Exchange/
 *    UseCapacite/None).
 *
 * Optional (fall back to RNG when absent):
 *  - pickChoice: called by the `choice` op to select one option from a list.
 *  - pickHeroTarget: resolves `any_hero` / `any_ally` tokens.
 *  - pickMonsterTarget: resolves MonsterPick objects with multiple candidates.
 *
 * Policies are stored per seat on GameState.policies during runGame().
 * Effect handlers consult `state.policies[currentSeat]` via helpers in this
 * module so individual ops don't depend on AI modules.
 */

import type { GameState } from '../engine/gameState.js';
import type { PlayerAction } from '../engine/actions.js';

/** Policy methods may return values synchronously (AI) or asynchronously (human UI). */
export type Awaitable<T> = T | PromiseLike<T>;

export interface Policy {
  name: string;
  /**
   * Optional reaction slot: fires useCapacite (or similar) opportunistically
   * outside the main action. The engine calls it both before and after the
   * main action so the policy can react to post-play state.
   */
  pickReaction?(state: GameState): Awaitable<PlayerAction | null>;
  pickAction(state: GameState): Awaitable<PlayerAction>;
  pickChoice?(
    state: GameState,
    sourceSeat: number,
    sourceCardId: string,
    options: ReadonlyArray<{ label: string }>,
  ): Awaitable<number>;
  pickHeroTarget?(
    state: GameState,
    sourceSeat: number,
    candidates: number[],
  ): Awaitable<number>;
  pickMonsterTarget?(
    state: GameState,
    sourceSeat: number,
    candidates: ReadonlyArray<{ seat: number; instanceId: string; cardId: string }>,
  ): Awaitable<number>;
  /**
   * Called before firing a posed reactive object (GUE_O02, MAG_O04, …) so
   * the policy can veto its consumption. Default: consume (true). Human
   * policy shows a modal "Utiliser objet X ?" with yes/no.
   */
  confirmReactiveObject?(
    state: GameState,
    ownerSeat: number,
    objectCardId: string,
    trigger: string,
  ): Awaitable<boolean>;
}

/** Look up the policy for a seat, or undefined if none. */
export function policyOf(state: GameState, seat: number): Policy | undefined {
  return state.policies[seat];
}
