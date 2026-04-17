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
import { summonMonsterInQueue, resolveAttackOrder } from './bossSequence.js';

export function resolveMenace(state: GameState, card: Menace): void {
  emit(state, {
    kind: 'DRAW_MENACE',
    card: card.id,
    name: card.nom,
    menaceType: card.type,
  });

  // Événements à choix are always skipped in J2.
  if (card.type === 'evenement') {
    notImplemented(state, 'menace_evenement', `${card.id} (${card.nom})`);
    emit(state, { kind: 'RESOLVE_MENACE', card: card.id, outcome: 'skipped_evenement' });
    return;
  }

  const sub = card.sous_type;
  const activeSeat = state.activeSeat;

  switch (sub) {
    case 'ordre_attaque':
      resolveAttackOrder(state, activeSeat);
      break;
    case 'ordre_attaque_special':
      resolveAttackOrder(state, activeSeat);
      resolveAttackOrder(state, activeSeat);
      break;
    case 'attaque':
    case 'attaque_speciale': {
      const dmg = card.degats ?? 1;
      damageHero(state, activeSeat, {
        amount: dmg,
        source: 'menace',
        sourceCardId: card.id,
      });
      break;
    }
    case 'invocation':
      summonMonsterInQueue(state, activeSeat);
      break;
    case 'invocation_speciale':
      summonMonsterInQueue(state, activeSeat);
      summonMonsterInQueue(state, activeSeat);
      break;
    default:
      // Assaut without a recognized sous_type (e.g. EPR_016 "Ouverture !").
      notImplemented(state, 'menace_assaut_unknown_subtype', `${card.id} (${card.nom})`);
      emit(state, { kind: 'RESOLVE_MENACE', card: card.id, outcome: 'skipped_unknown' });
      return;
  }

  emit(state, { kind: 'RESOLVE_MENACE', card: card.id, outcome: 'applied' });
}
