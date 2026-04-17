/**
 * Persistent modifier registry.
 *
 * A modifier is a runtime rule injected by effects (capacity, passif, objet
 * posé). It lives in the registry until its scope boundary clears it.
 *
 * Consumers:
 *  - `damage.damageHero` checks no_damage modifiers.
 *  - `heal.healHero`     applies heal_cap.
 *  - `playAction`        consumes bonus_damage_next.
 *
 * Scopes managed here:
 *  - 'thisTurn'         cleared by clearThisTurn() at END_TURN
 *  - 'nextDamageToSelf' cleared on first matching damage event
 *  - 'nextAttackByActive' cleared on first matching attack event
 */

import type { GameState } from './gameState.js';
import type { ModifierEffect, ModifierScope } from './effectTypes.js';

export interface ModifierRec {
  id: string;
  effect: ModifierEffect;
  scope: ModifierScope;
  /** Card / capacity id that emitted it — for logging. */
  sourceCardId: string;
  /** Monotonic counter for tie-breaking and stable ids. */
  addedAt: number;
}

function nextId(state: GameState): string {
  state.counters.event += 0; // no-op; use a separate counter
  const n = state.events.length;
  return `MOD${n}`;
}

export function addModifier(
  state: GameState,
  effect: ModifierEffect,
  scope: ModifierScope,
  sourceCardId: string,
): ModifierRec {
  const rec: ModifierRec = {
    id: nextId(state),
    effect,
    scope,
    sourceCardId,
    addedAt: state.events.length,
  };
  state.modifiers.push(rec);
  return rec;
}

export function removeModifier(state: GameState, id: string): void {
  const idx = state.modifiers.findIndex((m) => m.id === id);
  if (idx >= 0) state.modifiers.splice(idx, 1);
}

export function clearScope(state: GameState, scope: ModifierScope): void {
  state.modifiers = state.modifiers.filter((m) => m.scope !== scope);
}

/** Returns true iff damage to `seat` should be cancelled by any modifier. */
export function shouldCancelDamage(state: GameState, seat: number): { cancel: boolean; via?: ModifierRec } {
  for (const m of state.modifiers) {
    if (m.effect.kind === 'no_damage' && m.effect.seat === seat) {
      return { cancel: true, via: m };
    }
  }
  return { cancel: false };
}

/** Cap a heal budget according to active heal_cap modifiers (min wins). */
export function capHealBudget(state: GameState, budget: number): number {
  let cap = budget;
  for (const m of state.modifiers) {
    if (m.effect.kind === 'heal_cap' && m.effect.max < cap) cap = m.effect.max;
  }
  return cap;
}

/** Consume bonus_damage_next for `seat` and return the bonus amount. */
export function consumeAttackBonus(state: GameState, seat: number): number {
  let bonus = 0;
  const consumed: string[] = [];
  for (const m of state.modifiers) {
    if (m.effect.kind === 'bonus_damage_next' && m.effect.seat === seat) {
      bonus += m.effect.amount;
      consumed.push(m.id);
    }
  }
  consumed.forEach((id) => removeModifier(state, id));
  return bonus;
}

/** After a damage event on `seat`, clear nextDamageToSelf modifiers for them. */
export function onDamageResolved(state: GameState, seat: number): void {
  state.modifiers = state.modifiers.filter(
    (m) => !(m.scope === 'nextDamageToSelf' && m.effect.kind === 'no_damage' && m.effect.seat === seat),
  );
}

/** After an attack by `seat`, clear nextAttackByActive modifiers for them. */
export function onAttackResolved(state: GameState, seat: number): void {
  state.modifiers = state.modifiers.filter(
    (m) => !(m.scope === 'nextAttackByActive' &&
      m.effect.kind === 'bonus_damage_next' &&
      m.effect.seat === seat),
  );
}
