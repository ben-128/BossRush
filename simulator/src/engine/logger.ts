/**
 * Thin helper to append events to a game state's log.
 *
 * The engine never mutates state.events directly — it always goes through
 * `emit()`. This keeps the `t` counter monotonic and centralises any future
 * instrumentation (e.g. writing to a JSONL stream during batch runs).
 */

import type { GameState } from './gameState.js';
import type { GameEvent } from './events.js';

/**
 * Distributive Omit — preserves each variant of the discriminated union when
 * removing a common field. Without this, TS narrows the parameter to the
 * intersection of variants and rejects variant-specific fields.
 */
type DistributiveOmit<T, K extends keyof T> = T extends unknown ? Omit<T, K> : never;

export type EventInput = DistributiveOmit<GameEvent, 't'>;

/** Append a typed event. Fills `t` from the event counter. */
export function emit(state: GameState, ev: EventInput): void {
  state.counters.event += 1;
  const full = { ...ev, t: state.counters.event } as GameEvent;
  state.events.push(full);
}

/** Shortcut for developer warnings (not yet coded features). */
export function notImplemented(state: GameState, feature: string, detail?: string): void {
  emit(state, { kind: 'NOT_IMPLEMENTED', feature, ...(detail !== undefined ? { detail } : {}) });
}
