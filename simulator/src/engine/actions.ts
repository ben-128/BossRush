/**
 * Hero actions for the "ACTION" phase of a turn.
 *
 * J2 scope: Draw, Play (attack with optional renfort objets).
 *   - Exchange is NOT implemented in J2 (the random AI never exchanges).
 *   - Effects on cards (`effet` field) are IGNORED in J2. Only raw `degats`
 *     and `bonus_degats` are applied. Cards with a non-trivial `effet` are
 *     marked "unplayable" by the AI and won't be picked.
 *
 * An Action turn = choose one of:
 *   - DrawAction: draw 2 Chasse cards
 *   - PlayAction: play up to 1 Objet posé AND/OR play up to 1 Action
 *
 * For J2, the AI always commits to one specific action. No Capacité Spéciale
 * usage in J2 (will come with J5/J6 + effects DSL).
 */

import type { GameState, HeroRuntime } from './gameState.js';
import type { CarteChasse } from './types.js';
import { emit } from './logger.js';
import { drawOne, discard } from './piles.js';
import { damageHero, damageBoss, damageMonster } from './damage.js';
import { runOps, mkCtx } from './effects.js';
import { consumeAttackBonus, onAttackResolved } from './modifiers.js';
import { hookDiscardTopOnAction, hookDrawAllowed } from './bossPassifs.js';

// ---------------------------------------------------------------------------
// Action types exchanged with the AI policy
// ---------------------------------------------------------------------------

/** Optional explanation of why the AI picked this action. Shown in the log. */
export type ActionReason = string | undefined;

export type PlayerAction =
  | { kind: 'draw'; reason?: ActionReason }
  | { kind: 'useCapacite'; reason?: ActionReason }
  | {
      kind: 'play';
      placeObject?: number;
      playAction?: number;
      renforts?: number[];
      reason?: ActionReason;
    }
  | {
      kind: 'exchange';
      withSeat: number;
      give: number[];
      take: number[];
      reason?: ActionReason;
    }
  | { kind: 'none'; reason: string };

// ---------------------------------------------------------------------------
// Playability helpers
// ---------------------------------------------------------------------------

/**
 * A card is playable when:
 *   - it has an entry in the effects DSL (cards with coded logic), OR
 *   - it has no `effet` text and bare `degats` (J2 fallback for simple cards).
 * Cards with an `effet` text but no DSL entry remain unplayable and the AI
 * skips them (covered progressively in J6).
 */
export function isActionPlayable(state: GameState, c: CarteChasse): boolean {
  if (c.categorie !== 'action') return false;
  if (state.effects[c.id]) return true;
  return c.degats !== undefined && !c.effet;
}

/** Kept for backward compat with J2 tests. */
export const isActionPlayableJ2 = (c: CarteChasse): boolean =>
  c.categorie === 'action' && c.degats !== undefined && !c.effet;

/** Objets usable as renforts: either pure raw bonus or DSL-coded. */
export function isObjetPlayableRenfort(state: GameState, c: CarteChasse): boolean {
  if (c.categorie !== 'objet') return false;
  if (state.effects[c.id]) return true;
  return c.bonus_degats !== undefined && !c.effet;
}

export const isObjetPlayableRenfortJ2 = (c: CarteChasse): boolean =>
  c.categorie === 'objet' && c.bonus_degats !== undefined && !c.effet;

/** Hero has competence that matches a card's prerequis? */
export function meetsPrerequisite(h: HeroRuntime, c: CarteChasse, state: GameState): boolean {
  const hero = state.catalog.heroesById.get(h.heroId);
  if (!hero) return false;
  // Prerequis on the card is the hero name (e.g. "Nawel", "Daraa").
  return hero.nom === c.prerequis;
}

// ---------------------------------------------------------------------------
// Action resolvers
// ---------------------------------------------------------------------------

function doDraw(state: GameState, seat: number): void {
  const h = state.heroes[seat];
  if (!h) return;
  const drew: CarteChasse[] = [];
  // Kaggen passif caps at 1 draw per turn; we still emit ACTION_DRAW but
  // with fewer cards.
  const allowed = hookDrawAllowed(state, seat) ? 2 : 0;
  for (let i = 0; i < allowed; i++) {
    const c = drawOne(state, state.piles.chasse, 'chasse');
    if (!c) break;
    drew.push(c);
    emit(state, { kind: 'DRAW_CARD', pile: 'chasse', card: c.id, toSeat: seat });
  }
  h.hand.push(...drew);
  emit(state, { kind: 'ACTION_DRAW', seat, drew: drew.map((c) => c.id) });
}

/**
 * Default targeting per rules: an attack hits the queue head of own file; if
 * empty, it hits the boss.
 *
 * Returns a target description, or throws if no legal target (all dead).
 */
function chooseDefaultTarget(
  state: GameState,
  seat: number,
):
  | { kind: 'monster'; instanceId: string; seat: number }
  | { kind: 'boss' } {
  const h = state.heroes[seat];
  if (!h) throw new Error(`Bad seat ${seat}`);
  const head = h.queue[0];
  if (head) return { kind: 'monster', instanceId: head.instanceId, seat };
  return { kind: 'boss' };
}

function playAction(
  state: GameState,
  seat: number,
  handIdx: number,
  renfortObjectIndices: number[],
): void {
  const h = state.heroes[seat];
  if (!h) return;
  const card = h.hand[handIdx];
  if (!card) return;

  h.hand.splice(handIdx, 1);

  const renforts = renfortObjectIndices
    .slice()
    .sort((a, b) => b - a)
    .map((i) => ({ idx: i, card: h.objects[i] }))
    .filter((x) => x.card !== undefined) as { idx: number; card: CarteChasse }[];

  emit(state, {
    kind: 'ACTION_PLAY_ACTION',
    seat,
    card: card.id,
    renforts: renforts.map((r) => r.card.id),
  });

  const entry = state.effects[card.id];
  const bonusFromModifiers = consumeAttackBonus(state, seat);
  const bonusDmg =
    renforts.reduce((s, r) => s + (r.card.bonus_degats ?? 0), 0) + bonusFromModifiers;

  if (entry) {
    // DSL path: run ops. If ops include an `attack` without amount, we
    // synthesise its amount from card.degats + bonus at attack time —
    // the interpreter reads op.amount, so we adjust by mutating the op list
    // via a shallow copy.
    const ops = entry.ops.map((op) => {
      if (op.op === 'attack') {
        const base = op.amount ?? card.degats ?? 0;
        return { ...op, amount: base + bonusDmg };
      }
      return op;
    });
    runOps(state, mkCtx(seat, card.id, 'chasse'), ops);
  } else {
    // J2 fallback: raw degats against default target.
    const baseDmg = card.degats ?? 0;
    const totalDmg = baseDmg + bonusDmg;
    if (totalDmg > 0) {
      const target = chooseDefaultTarget(state, seat);
      emit(state, {
        kind: 'ATTACK',
        src: { kind: 'hero_action', seat, card: card.id },
        tgt: target,
        degats: totalDmg,
      });
      if (target.kind === 'boss') {
        damageBoss(state, { amount: totalDmg, source: 'chasse', sourceCardId: card.id });
      } else {
        damageMonster(state, target.seat, target.instanceId, {
          amount: totalDmg,
          source: 'chasse',
          sourceCardId: card.id,
        });
      }
    } else {
      discard(state.piles.chasse, card);
      emit(state, { kind: 'DISCARD_CARD', pile: 'chasse', card: card.id, fromSeat: seat });
    }
  }

  // Consume renfort objects: they leave the board after the action.
  for (const r of renforts) {
    h.objects.splice(r.idx, 1);
    discard(state.piles.chasse, r.card);
    emit(state, { kind: 'DISCARD_CARD', pile: 'chasse', card: r.card.id, fromSeat: seat });
  }

  onAttackResolved(state, seat);
  hookDiscardTopOnAction(state);
}

/**
 * Exchange: move cards between the active hero and a partner's hand.
 *
 * The rules say "Échanger des cartes Chasse avec un autre joueur". This is a
 * single whole-turn action (not combined with draw/play), and both sides
 * must agree. In this engine the active player drives; we assume the partner
 * consents (no veto system — the AI policy builds the exchange it wants).
 *
 * Validation is strict: indices must be in range, give/take are distinct sets,
 * partner must be alive and different from active.
 */
function doExchange(
  state: GameState,
  seat: number,
  withSeat: number,
  give: number[],
  take: number[],
): void {
  const a = state.heroes[seat];
  const b = state.heroes[withSeat];
  if (!a) return;
  if (!b || b.dead) {
    emit(state, { kind: 'ACTION_NONE', seat, reason: 'exchange_partner_unavailable' });
    return;
  }
  if (seat === withSeat) {
    emit(state, { kind: 'ACTION_NONE', seat, reason: 'exchange_self' });
    return;
  }
  // Deduplicate and validate ranges.
  const giveSet = new Set(give);
  const takeSet = new Set(take);
  if (giveSet.size !== give.length || takeSet.size !== take.length) {
    emit(state, { kind: 'ACTION_NONE', seat, reason: 'exchange_duplicate_indices' });
    return;
  }
  if (give.some((i) => i < 0 || i >= a.hand.length) || take.some((i) => i < 0 || i >= b.hand.length)) {
    emit(state, { kind: 'ACTION_NONE', seat, reason: 'exchange_index_out_of_range' });
    return;
  }

  // Collect cards before mutating (mutation by descending index to keep others valid).
  const given = give.map((i) => a.hand[i]!).map((c) => c);
  const received = take.map((i) => b.hand[i]!).map((c) => c);

  // Remove from each side (descending order).
  const removeDesc = (arr: CarteChasse[], indices: number[]): void => {
    indices.slice().sort((x, y) => y - x).forEach((i) => arr.splice(i, 1));
  };
  removeDesc(a.hand, give);
  removeDesc(b.hand, take);

  // Swap.
  a.hand.push(...received);
  b.hand.push(...given);

  emit(state, {
    kind: 'ACTION_EXCHANGE',
    seat,
    withSeat,
    given: given.map((c) => c.id),
    received: received.map((c) => c.id),
  });
}

function placeObject(state: GameState, seat: number, handIdx: number): void {
  const h = state.heroes[seat];
  if (!h) return;
  const card = h.hand[handIdx];
  if (!card || card.categorie !== 'objet') return;
  h.hand.splice(handIdx, 1);
  h.objects.push(card);
  emit(state, { kind: 'ACTION_PLAY_OBJECT', seat, card: card.id });
}

// ---------------------------------------------------------------------------
// Public entrypoint: apply one PlayerAction
// ---------------------------------------------------------------------------

function doUseCapacite(state: GameState, seat: number): void {
  const h = state.heroes[seat];
  if (!h) return;
  if (h.capaciteUsed) {
    emit(state, { kind: 'ACTION_NONE', seat, reason: 'capacite_already_used' });
    return;
  }
  const entry = state.effects[h.heroId];
  if (!entry) {
    emit(state, { kind: 'ACTION_NONE', seat, reason: 'capacite_not_implemented' });
    return;
  }
  h.capaciteUsed = true;
  emit(state, {
    kind: 'WARN',
    message: `capacite_used seat=${seat} hero=${h.heroId}`,
  });
  runOps(state, mkCtx(seat, h.heroId, 'chasse'), entry.ops);
}

export function applyPlayerAction(state: GameState, action: PlayerAction): void {
  const seat = state.activeSeat;
  switch (action.kind) {
    case 'draw':
      doDraw(state, seat);
      return;
    case 'useCapacite':
      doUseCapacite(state, seat);
      return;
    case 'play': {
      if (action.placeObject !== undefined) {
        placeObject(state, seat, action.placeObject);
      }
      if (action.playAction !== undefined) {
        playAction(state, seat, action.playAction, action.renforts ?? []);
      }
      return;
    }
    case 'exchange':
      doExchange(state, seat, action.withSeat, action.give, action.take);
      return;
    case 'none':
      emit(state, { kind: 'ACTION_NONE', seat, reason: action.reason });
      return;
    default: {
      const _exhaust: never = action;
      return _exhaust;
    }
  }
}
