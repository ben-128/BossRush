/**
 * Healing per rules (§ Soins (dépiler)):
 *   "Soigner de X = retirer des cartes blessure dont le total de 🩸 est ≤ X.
 *    Parcourez la pile en partant du BAS (blessure la plus récente) et
 *    remontez. Pour chaque carte : si ses 🩸 tiennent dans le budget, retirez
 *    et réduisez le budget ; sinon, passez et continuez à remonter."
 */

import type { GameState, HeroRuntime, Wound } from './gameState.js';
import { emit } from './logger.js';
import { capHealBudget } from './modifiers.js';

/**
 * Greedy bottom-up heal. Returns the amount actually healed.
 * NB: wounds removed that happen to be Monster cards are NOT eliminations
 * per the rules (§ Éliminer). We simply drop them — onEliminate hooks do
 * NOT fire. Since we track wounds as abstract records (not the literal card
 * objects), nothing moves to the discard beyond the wound record itself.
 */
function healStack(wounds: Wound[], budget: number): { removed: Wound[]; healed: number } {
  const removed: Wound[] = [];
  let remaining = budget;
  // Iterate from the END (most recent) toward the start.
  for (let i = wounds.length - 1; i >= 0 && remaining > 0; ) {
    const w = wounds[i]!;
    if (w.degats <= remaining) {
      removed.push(w);
      wounds.splice(i, 1);
      remaining -= w.degats;
      // i stays (we removed the element at i), but the array shrank so the
      // previous older wound is now at i-1. Decrement.
      i--;
    } else {
      // Skip this wound and keep looking upward.
      i--;
    }
  }
  return { removed, healed: budget - remaining };
}

export function healHero(state: GameState, seat: number, amount: number, source: string): number {
  const h = state.heroes[seat];
  if (!h || h.dead) return 0;
  const cappedBudget = capHealBudget(state, amount);
  const { removed, healed } = healStack(h.wounds, cappedBudget);
  if (healed > 0) state.healedThisTurn = true;
  emit(state, {
    kind: 'WARN',
    message: `heal seat=${seat} budget=${amount} healed=${healed} removedIds=${removed.map((w) => w.woundId).join(',')} source=${source}`,
  });
  return healed;
}

export function removeAllWounds(state: GameState, seat: number): number {
  const h: HeroRuntime | undefined = state.heroes[seat];
  if (!h) return 0;
  const total = h.wounds.reduce((s, w) => s + w.degats, 0);
  h.wounds = [];
  return total;
}
