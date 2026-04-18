/**
 * Menace resolution (J2 scope).
 *
 * J2 supports only assauts whose mechanics are fully determined by
 * `sous_type` + `degats` + icon tokens in the description:
 *
 *   ordre_attaque          → 1 attack order (queue head attacks active hero)
 *   ordre_attaque_special  → 2 attack orders (Ruée)
 *   attaque                → direct damage with fixed degats
 *   attaque_speciale       → direct damage (higher fixed degats)
 *   invocation             → 1 monster summoned in active hero's queue
 *   invocation_speciale    → 2 monsters summoned (Horde)
 *
 * Everything else (événements à choix, EPR_016 "Ouverture !", etc.) is logged
 * as NOT_IMPLEMENTED and has no effect in J2. These card ids will be revisited
 * in J3 when the effect DSL exists.
 */

import type { GameState } from './gameState.js';
import type { Menace } from './types.js';
import { emit, notImplemented } from './logger.js';
import { damageHero } from './damage.js';
import { summonMonsterInQueue, resolveAttackOrder, triggerBossActif } from './bossSequence.js';
import { runOps, mkCtx } from './effects.js';
import { discard } from './piles.js';
import { fireReactiveForAll } from './reactiveObjects.js';

export async function resolveMenace(state: GameState, card: Menace): Promise<void> {
  emit(state, {
    kind: 'DRAW_MENACE',
    card: card.id,
    name: card.nom,
    menaceType: card.type,
  });

  state.menaceCancelled = false;

  // Reactive posed objects: any hero with on_menace_revealed can fire.
  await fireReactiveForAll(state, 'on_menace_revealed');
  if (state.menaceCancelled) {
    emit(state, { kind: 'RESOLVE_MENACE', card: card.id, outcome: 'cancelled' });
    return;
  }

  // Legacy tag-based interrupt (kept for backward compat; new rules use
  // reactive.trigger='on_menace_revealed' instead).
  const h = state.heroes[state.activeSeat];
  if (h && card.type === 'assaut') {
    const sub = card.sous_type;
    const isHostile =
      sub === 'attaque' ||
      sub === 'attaque_speciale' ||
      sub === 'invocation' ||
      sub === 'invocation_speciale' ||
      sub === 'ordre_attaque' ||
      sub === 'ordre_attaque_special' ||
      sub === 'capacite_boss';
    if (isHostile) {
      const cancelIdx = h.objects.findIndex(
        (c) => state.effects[c.id]?.tag === 'cancel_menace',
      );
      if (cancelIdx !== -1) {
        const obj = h.objects[cancelIdx]!;
        h.objects.splice(cancelIdx, 1);
        emit(state, { kind: 'OBJECT_USED', seat: state.activeSeat, card: obj.id, reason: `annule ${card.nom}` });
        discard(state.piles.chasse, obj);
        emit(state, { kind: 'DISCARD_CARD', pile: 'chasse', card: obj.id, fromSeat: state.activeSeat });
        emit(state, { kind: 'RESOLVE_MENACE', card: card.id, outcome: 'cancelled_by_object' });
        return;
      }
    }
  }

  // If we have a DSL entry for this Menace (event or otherwise), run it.
  const entry = state.effects[card.id];
  if (entry) {
    await runOps(state, mkCtx(state.activeSeat, card.id, 'menace'), entry.ops);
    if (state.menaceCancelled) {
      emit(state, { kind: 'RESOLVE_MENACE', card: card.id, outcome: 'cancelled' });
      return;
    }
    emit(state, { kind: 'RESOLVE_MENACE', card: card.id, outcome: 'applied_dsl' });
    return;
  }

  // No DSL : événements are skipped (choice op unavailable for this card).
  if (card.type === 'evenement') {
    notImplemented(state, 'menace_evenement', `${card.id} (${card.nom})`);
    emit(state, { kind: 'RESOLVE_MENACE', card: card.id, outcome: 'skipped_evenement' });
    return;
  }

  const sub = card.sous_type;
  const activeSeat = state.activeSeat;

  switch (sub) {
    case 'ordre_attaque':
      await resolveAttackOrder(state, activeSeat);
      break;
    case 'ordre_attaque_special':
      await resolveAttackOrder(state, activeSeat);
      await resolveAttackOrder(state, activeSeat);
      break;
    case 'attaque':
    case 'attaque_speciale': {
      const dmg = card.degats ?? 1;
      await damageHero(state, activeSeat, {
        amount: dmg,
        source: 'menace',
        sourceCardId: card.id,
      });
      break;
    }
    case 'invocation':
      await summonMonsterInQueue(state, activeSeat);
      break;
    case 'invocation_speciale':
      await summonMonsterInQueue(state, activeSeat);
      await summonMonsterInQueue(state, activeSeat);
      break;
    case 'capacite_boss':
      await triggerBossActif(state);
      break;
    default:
      // Assaut without a recognized sous_type (e.g. EPR_016 "Ouverture !").
      notImplemented(state, 'menace_assaut_unknown_subtype', `${card.id} (${card.nom})`);
      emit(state, { kind: 'RESOLVE_MENACE', card: card.id, outcome: 'skipped_unknown' });
      return;
  }

  emit(state, { kind: 'RESOLVE_MENACE', card: card.id, outcome: 'applied' });
}
