/**
 * Human policy — delegates every decision to a pending-decision queue managed
 * by the UI store. When the engine calls `pickAction` / `pickChoice` / etc.,
 * this policy returns a Promise that resolves when the user clicks an option
 * in the UI modal.
 *
 * The `pendingDecision` mechanism is intentionally kept in `human.ts` rather
 * than the store so the engine doesn't need to import the React store; the
 * store merely forwards resolve callbacks via `setPendingDecision`.
 */

import type { GameState } from '../engine/gameState.js';
import type { PlayerAction } from '../engine/actions.js';
import type { Policy } from './policy.js';
import { heuristicPolicy } from './heuristic.js';

export type PendingDecision =
  | {
      kind: 'action';
      seat: number;
      resolve: (action: PlayerAction) => void;
    }
  | {
      kind: 'reaction';
      seat: number;
      resolve: (action: PlayerAction | null) => void;
    }
  | {
      kind: 'choice';
      seat: number;
      sourceCardId: string;
      options: ReadonlyArray<{ label: string }>;
      resolve: (idx: number) => void;
    }
  | {
      kind: 'heroTarget';
      seat: number;
      candidates: number[];
      resolve: (idx: number) => void;
    }
  | {
      kind: 'monsterTarget';
      seat: number;
      candidates: ReadonlyArray<{ seat: number; instanceId: string; cardId: string }>;
      resolve: (idx: number) => void;
    }
  | {
      kind: 'confirmReactive';
      seat: number;
      objectCardId: string;
      trigger: string;
      resolve: (use: boolean) => void;
    }
  | {
      kind: 'discard';
      seat: number;
      n: number;
      reason: string;
      resolve: (indices: number[]) => void;
    };

/**
 * Thread-local (module-local) pending decision. The UI store assigns a setter
 * via `setPendingDecisionSink` at init; the policy below pushes decisions
 * through it. Only one decision can be pending at a time — the engine
 * awaits each one sequentially.
 */
let pendingSink: ((d: PendingDecision | null) => void) | null = null;

export function setPendingDecisionSink(fn: (d: PendingDecision | null) => void): void {
  pendingSink = fn;
}

function waitFor<T>(
  make: (resolve: (value: T) => void) => PendingDecision,
): Promise<T> {
  return new Promise<T>((resolve) => {
    const decision = make(resolve);
    if (!pendingSink) {
      // No UI sink — shouldn't happen in practice; bail quietly.
      // eslint-disable-next-line no-console
      console.warn('HumanPolicy: no UI sink set; falling back to rejected promise');
      return;
    }
    pendingSink(decision);
  });
}

export const humanPolicy: Policy = {
  name: 'human',

  pickAction(state: GameState): Promise<PlayerAction> {
    const seat = state.activeSeat;
    return waitFor<PlayerAction>((resolve) => ({
      kind: 'action',
      seat,
      resolve,
    }));
  },

  pickReaction(state: GameState): Promise<PlayerAction | null> {
    const seat = state.activeSeat;
    // Delegate non-reaction turns to heuristic: if no capacité / posed
    // object triggers a useful reaction, just return null synchronously.
    const heuristic = heuristicPolicy.pickReaction?.(state) ?? null;
    if (heuristic === null) return Promise.resolve(null);
    // Otherwise ask the user.
    return waitFor<PlayerAction | null>((resolve) => ({
      kind: 'reaction',
      seat,
      resolve,
    }));
  },

  pickChoice(
    state: GameState,
    sourceSeat: number,
    sourceCardId: string,
    options: ReadonlyArray<{ label: string }>,
  ): Promise<number> {
    return waitFor<number>((resolve) => ({
      kind: 'choice',
      seat: sourceSeat,
      sourceCardId,
      options,
      resolve,
    }));
  },

  pickHeroTarget(
    state: GameState,
    sourceSeat: number,
    candidates: number[],
  ): Promise<number> {
    // Single candidate → auto-resolve.
    if (candidates.length === 1) return Promise.resolve(0);
    return waitFor<number>((resolve) => ({
      kind: 'heroTarget',
      seat: sourceSeat,
      candidates,
      resolve,
    }));
  },

  pickMonsterTarget(
    state: GameState,
    sourceSeat: number,
    candidates: ReadonlyArray<{ seat: number; instanceId: string; cardId: string }>,
  ): Promise<number> {
    if (candidates.length === 1) return Promise.resolve(0);
    return waitFor<number>((resolve) => ({
      kind: 'monsterTarget',
      seat: sourceSeat,
      candidates,
      resolve,
    }));
  },

  confirmReactiveObject(
    _state: GameState,
    ownerSeat: number,
    objectCardId: string,
    trigger: string,
  ): Promise<boolean> {
    return waitFor<boolean>((resolve) => ({
      kind: 'confirmReactive',
      seat: ownerSeat,
      objectCardId,
      trigger,
      resolve,
    }));
  },

  pickDiscard(
    state: GameState,
    targetSeat: number,
    n: number,
    reason: string,
  ): Promise<number[]> {
    const h = state.heroes[targetSeat];
    // Auto-resolve trivial cases so we don't interrupt for nothing.
    if (!h || h.hand.length === 0) return Promise.resolve([]);
    if (h.hand.length <= n) {
      return Promise.resolve(h.hand.map((_, i) => i));
    }
    return waitFor<number[]>((resolve) => ({
      kind: 'discard',
      seat: targetSeat,
      n,
      reason,
      resolve,
    }));
  },
};
