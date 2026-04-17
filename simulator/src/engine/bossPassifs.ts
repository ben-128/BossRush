/**
 * Boss passif dispatch — runtime hooks that aren't expressible as a simple
 * modifier.
 *
 * The active boss's `passif_hooks` entry lists which behaviours are on. Each
 * hook is checked in the call site(s) below. Keeps the logic contained and
 * easy to locate.
 */

import type { GameState } from './gameState.js';
import { emit } from './logger.js';
import { drawOne, discard } from './piles.js';
import { damageBoss } from './damage.js';

function hooks(state: GameState): readonly string[] {
  const entry = state.effects[state.boss.bossId];
  return entry?.passif_hooks ?? [];
}

/** Caicai : ordres d'attaque touchent aussi la file du héros suivant. */
export function hookExtraAttackOrderQueue(state: GameState): number | undefined {
  if (!hooks(state).includes('attack_order_next_queue_too')) return undefined;
  for (let offset = 1; offset <= state.nPlayers; offset++) {
    const idx = (state.activeSeat + offset) % state.nPlayers;
    const h = state.heroes[idx];
    if (h && !h.dead) return idx;
  }
  return undefined;
}

/** Kaggen : maximum 1 pioche par tour et par héros. Incrémente puis check. */
export function hookDrawAllowed(state: GameState, seat: number): boolean {
  if (!hooks(state).includes('max_draws_per_turn_1')) return true;
  state.perTurnDraws ??= {};
  const n = state.perTurnDraws[seat] ?? 0;
  if (n >= 1) {
    emit(state, { kind: 'WARN', message: `kaggen blocked draw seat=${seat}` });
    return false;
  }
  state.perTurnDraws[seat] = n + 1;
  return true;
}

/** Pshato : fin de tour, main cap à 6. */
export function hookHandCapAtEndOfTurn(state: GameState): void {
  if (!hooks(state).includes('hand_cap_6_end_of_turn')) return;
  const h = state.heroes[state.activeSeat];
  if (!h) return;
  while (h.hand.length > 6) {
    const c = h.hand.shift();
    if (!c) break;
    discard(state.piles.chasse, c);
    emit(state, { kind: 'DISCARD_CARD', pile: 'chasse', card: c.id, fromSeat: state.activeSeat });
  }
}

/** Gaww : reshuffle Chasse → boss heal 2. Called from piles.ensureDrawable. */
export function hookReshuffleHealsBoss(state: GameState, pileName: string): void {
  if (pileName !== 'chasse') return;
  if (!hooks(state).includes('reshuffle_heals_boss_2')) return;
  let budget = 2;
  for (let i = state.boss.wounds.length - 1; i >= 0 && budget > 0; ) {
    const w = state.boss.wounds[i]!;
    if (w.degats <= budget) {
      state.boss.wounds.splice(i, 1);
      budget -= w.degats;
      i--;
    } else {
      i--;
    }
  }
  emit(state, { kind: 'WARN', message: 'gaww: boss healed 2 on chasse reshuffle' });
}

/** Akkoro : chaque carte Action jouée défausse le top de la pile Chasse. */
export function hookDiscardTopOnAction(state: GameState): void {
  if (!hooks(state).includes('active_discards_top_chasse_on_action')) return;
  const c = drawOne(state, state.piles.chasse, 'chasse');
  if (!c) return;
  discard(state.piles.chasse, c);
  emit(state, { kind: 'DISCARD_CARD', pile: 'chasse', card: c.id });
}

/** Invunche : quand un héros est blessé par le boss, il pioche un Destin. */
export function hookInvuncheDrawDestinOnDamage(state: GameState, seat: number): void {
  if (!hooks(state).includes('invunche_draw_destin_on_damage')) return;
  const d = drawOne(state, state.piles.destin, 'destin');
  if (!d) return;
  emit(state, { kind: 'DRAW_CARD', pile: 'destin', card: d.id, toSeat: seat });
  // For simplicity: apply DSL ops for the destin if present, then discard.
  const entry = state.effects[d.id];
  if (entry?.ops) {
    // runOps import would create a cycle; defer via dynamic import.
    import('./effects.js').then(({ runOps, mkCtx }) => {
      runOps(state, mkCtx(seat, d.id, 'destin'), entry.ops!);
    });
  }
  discard(state.piles.destin, d);
}

/** Khwa : le boss ne peut recevoir des dégâts qu'une fois par tour. */
export function hookBossDamageAllowed(state: GameState): boolean {
  if (!hooks(state).includes('boss_receives_max_1_damage_per_turn')) return true;
  if (state.bossDamagedThisTurn) {
    emit(state, { kind: 'WARN', message: 'khwa: boss already damaged this turn, blocking' });
    return false;
  }
  state.bossDamagedThisTurn = true;
  return true;
}

/** Reset per-turn flags at START_TURN. */
export function resetPerTurnFlags(state: GameState): void {
  state.perTurnDraws = {};
  state.bossDamagedThisTurn = false;
}
