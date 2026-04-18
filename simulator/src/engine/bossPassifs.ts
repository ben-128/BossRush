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
import { runOps, mkCtx } from './effects.js';

function hooks(state: GameState): readonly string[] {
  const entry = state.effects[state.boss.bossId];
  return entry?.passif_hooks ?? [];
}

/** Caicai : ordres d'attaque additionnels sur toutes les files (ou sur la file du héros suivant selon le hook). */
export function hookExtraAttackOrderQueues(state: GameState): number[] {
  const hs = hooks(state);
  if (hs.includes('attack_order_all_queues')) {
    const out: number[] = [];
    for (let offset = 1; offset <= state.nPlayers; offset++) {
      const idx = (state.activeSeat + offset) % state.nPlayers;
      const h = state.heroes[idx];
      if (h && !h.dead) out.push(idx);
    }
    return out;
  }
  if (hs.includes('attack_order_next_queue_too')) {
    for (let offset = 1; offset <= state.nPlayers; offset++) {
      const idx = (state.activeSeat + offset) % state.nPlayers;
      const h = state.heroes[idx];
      if (h && !h.dead) return [idx];
    }
  }
  return [];
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

/** Pshato (et variantes) : fin de tour, main cappée à N. */
export function hookHandCapAtEndOfTurn(state: GameState): void {
  const hs = hooks(state);
  let cap: number | null = null;
  if (hs.includes('hand_cap_5_end_of_turn')) cap = 5;
  else if (hs.includes('hand_cap_6_end_of_turn')) cap = 6;
  if (cap === null) return;
  const h = state.heroes[state.activeSeat];
  if (!h) return;
  while (h.hand.length > cap) {
    const c = h.hand.shift();
    if (!c) break;
    discard(state.piles.chasse, c);
    emit(state, { kind: 'DISCARD_CARD', pile: 'chasse', card: c.id, fromSeat: state.activeSeat });
  }
}

/** Gaww : reshuffle Chasse → boss heal X. X = 2 (legacy) ou = nb héros vivants. */
export function hookReshuffleHealsBoss(state: GameState, pileName: string): void {
  if (pileName !== 'chasse') return;
  const hs = hooks(state);
  let budget = 0;
  if (hs.includes('gaww_reshuffle_heals_per_alive_hero')) {
    budget = state.heroes.filter((h) => !h.dead).length;
  } else if (hs.includes('reshuffle_heals_boss_2')) {
    budget = 2;
  }
  if (budget <= 0) return;
  const heal = budget;
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
  emit(state, { kind: 'WARN', message: `gaww: boss healed ${heal} on chasse reshuffle` });
}

/** Azhda : immunisé tant que monstres >= héros vivants. */
export function hookAzhdaImmune(state: GameState): boolean {
  if (!hooks(state).includes('azhda_immune_if_monsters_gte_heroes')) return false;
  const living = state.heroes.filter((h) => !h.dead);
  const monsters = living.reduce((s, h) => s + h.queue.length, 0);
  return monsters >= living.length;
}

/** Akkoro (legacy) : chaque carte Action jouée défausse le top de la pile Chasse. */
export function hookDiscardTopOnAction(state: GameState): void {
  if (!hooks(state).includes('active_discards_top_chasse_on_action')) return;
  const c = drawOne(state, state.piles.chasse, 'chasse');
  if (!c) return;
  discard(state.piles.chasse, c);
  emit(state, { kind: 'DISCARD_CARD', pile: 'chasse', card: c.id });
}

/** Akkoro : fin de tour, si le héros actif a blessé Akkoro → défausse 1 Chasse. */
export function hookAkkoroDamageDiscardsChasse(state: GameState): void {
  if (!hooks(state).includes('akkoro_damage_discards_chasse')) return;
  if (!state.activeDamagedBossThisTurn) return;
  const h = state.heroes[state.activeSeat];
  if (!h || h.hand.length === 0) return;
  const c = h.hand.shift()!;
  discard(state.piles.chasse, c);
  emit(state, { kind: 'DISCARD_CARD', pile: 'chasse', card: c.id, fromSeat: state.activeSeat });
  emit(state, { kind: 'WARN', message: `akkoro passif: seat ${state.activeSeat} défausse 1 Chasse` });
}

/** Invunche (legacy passif) : quand un héros est blessé, il pioche un Destin. */
export async function hookInvuncheDrawDestinOnDamage(state: GameState, seat: number): Promise<void> {
  if (!hooks(state).includes('invunche_draw_destin_on_damage')) return;
  const d = drawOne(state, state.piles.destin, 'destin');
  if (!d) return;
  emit(state, { kind: 'DRAW_CARD', pile: 'destin', card: d.id, toSeat: seat });
  emit(state, { kind: 'RESOLVE_DESTIN', card: d.id, toSeat: seat });
  const entry = state.effects[d.id];
  if (entry?.ops) {
    await runOps(state, mkCtx(seat, d.id, 'destin'), entry.ops);
  }
  discard(state.piles.destin, d);
}

/** Invunche (nouveau) : quand blessé par Invunche, le héros perd sa capacité. */
export function hookInvuncheDamageMarksCapaciteUsed(state: GameState, seat: number): void {
  if (!hooks(state).includes('invunche_damage_marks_capacite_used')) return;
  const h = state.heroes[seat];
  if (!h || h.capaciteUsed) return;
  h.capaciteUsed = true;
  emit(state, { kind: 'WARN', message: `invunche passif: seat ${seat} perd sa capacité` });
}

/** Kaggen : quand un héros élimine un monstre, il pioche 1 Chasse. */
export function hookKaggenElimDrawsChasse(state: GameState, seat: number): void {
  if (!hooks(state).includes('kaggen_elim_draws_chasse')) return;
  const h = state.heroes[seat];
  if (!h) return;
  const c = drawOne(state, state.piles.chasse, 'chasse');
  if (!c) return;
  h.hand.push(c);
  emit(state, { kind: 'DRAW_CARD', pile: 'chasse', card: c.id, toSeat: seat });
}

/** Khwa + Azhda : contrôle si le boss peut recevoir des dégâts en ce moment. */
export function hookBossDamageAllowed(state: GameState): boolean {
  // Azhda : immunité conditionnée par nb monstres >= nb héros vivants.
  if (hookAzhdaImmune(state)) {
    emit(state, { kind: 'WARN', message: 'azhda: immune (monstres >= héros vivants)' });
    return false;
  }
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
  state.activeDamagedBossThisTurn = false;
}

/** Azhda : true iff the boss acts before the hero this turn. */
export function hookBossBeforeHeroes(state: GameState): boolean {
  return hooks(state).includes('boss_before_heroes');
}
