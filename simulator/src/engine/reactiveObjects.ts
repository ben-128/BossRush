/**
 * Reactive object triggers — the "Réaction :" objects from the new card
 * design. A posed Objet with `reactive.trigger` sitting in a hero's objects
 * array fires its ops when the matching event is emitted, then is discarded.
 *
 * Each object triggers at most once and is consumed, which matches the FR
 * rules: "Réaction : quand X ... → appliquer puis défausser l'objet."
 */

import type { GameState } from './gameState.js';
import type { ReactiveTrigger } from './effectTypes.js';
import { emit } from './logger.js';
import { discard } from './piles.js';
import { runOps, mkCtx } from './effects.js';

/**
 * Scan a single hero's posed objects for the given trigger and fire the first
 * match. Multiple objects with the same trigger fire in order, each once.
 */
export function fireReactiveObjectTriggers(
  state: GameState,
  trigger: ReactiveTrigger,
  ownerSeat: number,
): void {
  const h = state.heroes[ownerSeat];
  if (!h) return;
  // Copy to avoid splice-during-iterate issues when the ops chain mutates.
  const snapshot = h.objects.slice();
  for (const obj of snapshot) {
    const entry = state.effects[obj.id];
    if (entry?.reactive?.trigger !== trigger) continue;
    const idx = h.objects.indexOf(obj);
    if (idx < 0) continue; // already consumed by a prior ops chain
    h.objects.splice(idx, 1);
    emit(state, {
      kind: 'OBJECT_USED',
      seat: ownerSeat,
      card: obj.id,
      reason: `réaction ${trigger}`,
    });
    runOps(state, mkCtx(ownerSeat, obj.id, 'chasse'), entry.reactive.ops);
    discard(state.piles.chasse, obj);
    emit(state, { kind: 'DISCARD_CARD', pile: 'chasse', card: obj.id, fromSeat: ownerSeat });
  }
}

/** Convenience: fire on the active seat. */
export function fireReactiveActive(state: GameState, trigger: ReactiveTrigger): void {
  fireReactiveObjectTriggers(state, trigger, state.activeSeat);
}

/** Fire on every hero EXCEPT the given seat (used for "on_ally_damage"). */
export function fireReactiveForAllies(
  state: GameState,
  trigger: ReactiveTrigger,
  exceptSeat: number,
): void {
  for (const h of state.heroes) {
    if (h.dead || h.seatIdx === exceptSeat) continue;
    fireReactiveObjectTriggers(state, trigger, h.seatIdx);
  }
}

/** Fire on every living hero (used for "on_destin_drawn_any", "on_menace_revealed"). */
export function fireReactiveForAll(state: GameState, trigger: ReactiveTrigger): void {
  for (const h of state.heroes) {
    if (h.dead) continue;
    fireReactiveObjectTriggers(state, trigger, h.seatIdx);
  }
}
