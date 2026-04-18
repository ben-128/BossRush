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
import { evalCondition } from './targets.js';
import { hookDiscardTopOnAction, hookDrawAllowed } from './bossPassifs.js';
import {
  fireReactiveObjectTriggers,
  fireReactiveForAllies,
} from './reactiveObjects.js';

// ---------------------------------------------------------------------------
// Action types exchanged with the AI policy
// ---------------------------------------------------------------------------

/** Optional explanation of why the AI picked this action. Shown in the log. */
export type ActionReason = string | undefined;

export type PlayerAction =
  | { kind: 'draw'; reason?: ActionReason }
  | { kind: 'useCapacite'; reason?: ActionReason }
  | { kind: 'useObject'; objectIdx: number; reason?: ActionReason }
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

/**
 * Stronger check than `isActionPlayable`: also ensures any top-level `require`
 * op in the DSL entry currently holds for the active hero. Used by both the
 * manual-mode UI and the heuristic to avoid wasting cards like GUE_A06 Rage
 * du blessé (self_damage ≥ 4) when the precondition isn't met.
 *
 * Requires nested inside a `choice` / `forEach` branch are NOT inspected —
 * only top-level ops, which is where conditional unlock gates live today.
 */
export function isActionPlayableNow(
  state: GameState,
  seat: number,
  c: CarteChasse,
): boolean {
  if (!isActionPlayable(state, c)) return false;
  const entry = state.effects[c.id];
  if (!entry?.ops) return true;
  for (const op of entry.ops) {
    if (op.op !== 'require') continue;
    if (!evalCondition(state, seat, op.cond)) return false;
  }
  return true;
}

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
  // One-shot bypass from MAG_O02 Braise errante.
  if (h.nextActionIgnoresPrereq) return true;
  const hero = state.catalog.heroesById.get(h.heroId);
  if (!hero) return false;
  return hero.nom === c.prerequis;
}

// ---------------------------------------------------------------------------
// Action resolvers
// ---------------------------------------------------------------------------

async function doDraw(state: GameState, seat: number, reason?: string): Promise<void> {
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
  h.drawsThisTurn = (h.drawsThisTurn ?? 0) + drew.length;
  // Reactive triggers for hand-size thresholds.
  // ROD_O06 Sève de tamo : quand ce héros pioche avec 7+ cartes en main.
  if (h.hand.length >= 7) {
    await fireReactiveObjectTriggers(state, 'on_self_high_hand_draw', seat);
  }
  if (h.hand.length === 1) {
    await fireReactiveObjectTriggers(state, 'on_self_low_hand', seat);
  }
  emit(state, { kind: 'ACTION_DRAW', seat, drew: drew.map((c) => c.id), ...(reason ? { reason } : {}) });
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

async function playAction(
  state: GameState,
  seat: number,
  handIdx: number,
  renfortObjectIndices: number[],
  reason?: string,
): Promise<void> {
  const h = state.heroes[seat];
  if (!h) return;
  const card = h.hand[handIdx];
  if (!card) return;

  // Upfront gate: top-level `require` conditions are checked before the card
  // is announced/committed. This avoids wasting cards like GUE_A06 (self_damage
  // ≥ 4) when the precondition isn't met — card stays in hand, renforts not
  // consumed, ACTION_NONE surfaces a visible refusal in the log.
  if (!isActionPlayableNow(state, seat, card)) {
    emit(state, {
      kind: 'ACTION_NONE',
      seat,
      reason: `require_failed:${card.id}`,
    });
    return;
  }

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
    ...(reason ? { reason } : {}),
  });

  const entry = state.effects[card.id];
  const bonusFromModifiers = consumeAttackBonus(state, seat);
  const bonusDmg =
    renforts.reduce((s, r) => s + (r.card.bonus_degats ?? 0), 0) + bonusFromModifiers;

  // Renfort objects fire their DSL ops BEFORE the main attack / prereq check,
  // so flags like `nextActionIgnoresPrereq` (MAG_O02) and `chainAttackOnKill`
  // (ROD_O02) are in effect by the time the action resolves. `bonus_degats`
  // is factored into `bonusDmg`. Each renfort is then discarded.
  for (const r of renforts) {
    h.objects.splice(r.idx, 1);
    const rEntry = state.effects[r.card.id];
    const skipOps = rEntry?.tag === 'boost_attack';
    if (rEntry && !skipOps) {
      await runOps(state, mkCtx(seat, r.card.id, 'chasse'), rEntry.ops ?? []);
    }
    discard(state.piles.chasse, r.card);
    emit(state, { kind: 'DISCARD_CARD', pile: 'chasse', card: r.card.id, fromSeat: seat });
  }

  // Validate prerequisite AFTER renforts have fired — MAG_O02 can now have
  // set `nextActionIgnoresPrereq` above.
  if (!meetsPrerequisite(h, card, state) && !h.nextActionIgnoresPrereq) {
    emit(state, {
      kind: 'ACTION_NONE',
      seat,
      reason: `prereq_mismatch:${card.id}`,
    });
    return;
  }
  h.hand.splice(handIdx, 1);
  if (h.nextActionIgnoresPrereq) h.nextActionIgnoresPrereq = false;
  h.actionsPlayedThisTurn = (h.actionsPlayedThisTurn ?? 0) + 1;
  if (h.actionsPlayedThisTurn === 2) {
    await fireReactiveObjectTriggers(state, 'on_self_played_2_actions', seat);
  }
  if (h.hand.length === 1) {
    await fireReactiveObjectTriggers(state, 'on_self_low_hand', seat);
  }

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
    await runOps(state, mkCtx(seat, card.id, 'chasse'), ops);
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
        await damageBoss(state, { amount: totalDmg, source: 'chasse', sourceCardId: card.id });
      } else {
        await damageMonster(state, target.seat, target.instanceId, {
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

  // Clear chain-on-kill if a renfort set it but the card didn't actually
  // attack (or no kill happened).
  if (h.chainAttackOnKill) h.chainAttackOnKill = false;

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
async function doExchange(
  state: GameState,
  seat: number,
  withSeat: number,
  give: number[],
  take: number[],
  reason?: string,
): Promise<void> {
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
  // Prereq gate: you can only give cards your partner can actually use, and
  // only take cards your own hero can use. Cards without a prereq are
  // universally legal (rare, but handled).
  const aNom = state.catalog.heroesById.get(a.heroId)?.nom;
  const bNom = state.catalog.heroesById.get(b.heroId)?.nom;
  for (const idx of give) {
    const c = a.hand[idx]!;
    if (c.prerequis && c.prerequis !== bNom) {
      emit(state, { kind: 'ACTION_NONE', seat, reason: `exchange_give_prereq_mismatch:${c.id}` });
      return;
    }
  }
  for (const idx of take) {
    const c = b.hand[idx]!;
    if (c.prerequis && c.prerequis !== aNom) {
      emit(state, { kind: 'ACTION_NONE', seat, reason: `exchange_take_prereq_mismatch:${c.id}` });
      return;
    }
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
    ...(reason ? { reason } : {}),
  });
  // Reactive triggers: both participants see an exchange happen. We stash
  // the "other" seat in state.exchangePartner so ops can target it via the
  // `exchange_partner` hero-target token (used by DIP_O03/O04).
  state.exchangePartner = withSeat;
  await fireReactiveObjectTriggers(state, 'on_self_exchange', seat);
  state.exchangePartner = seat;
  await fireReactiveObjectTriggers(state, 'on_self_exchange', withSeat);
  delete state.exchangePartner;
}

function placeObject(state: GameState, seat: number, handIdx: number, reason?: string): void {
  const h = state.heroes[seat];
  if (!h) return;
  const card = h.hand[handIdx];
  if (!card || card.categorie !== 'objet') return;
  // Gate: the objet's prerequis must match this hero's name. MAG_O02's
  // "ignore prereq" only applies to Actions, not to posing Objets — objets
  // belong to a specific hero by design.
  const heroNom = state.catalog.heroesById.get(h.heroId)?.nom;
  if (card.prerequis && heroNom && card.prerequis !== heroNom) {
    emit(state, {
      kind: 'ACTION_NONE',
      seat,
      reason: `prereq_mismatch_objet:${card.id}`,
    });
    return;
  }
  h.hand.splice(handIdx, 1);
  h.objects.push(card);
  emit(state, { kind: 'ACTION_PLAY_OBJECT', seat, card: card.id, ...(reason ? { reason } : {}) });
}

// ---------------------------------------------------------------------------
// Public entrypoint: apply one PlayerAction
// ---------------------------------------------------------------------------

async function doUseCapacite(state: GameState, seat: number): Promise<void> {
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
  emit(state, { kind: 'CAPACITE_USED', seat, heroId: h.heroId });
  await runOps(state, mkCtx(seat, h.heroId, 'chasse'), entry.ops);
  // Reactive triggers around capacité usage.
  await fireReactiveObjectTriggers(state, 'on_self_capacite_used', seat);
  await fireReactiveForAllies(state, 'on_ally_capacite_used', seat);
}

/** Active use of a posed object: run its DSL ops, then discard. */
async function doUseObject(state: GameState, seat: number, objectIdx: number, reason?: string): Promise<void> {
  const h = state.heroes[seat];
  if (!h) return;
  const card = h.objects[objectIdx];
  if (!card) return;
  const entry = state.effects[card.id];
  if (!entry || !entry.ops || entry.ops.length === 0) {
    emit(state, { kind: 'ACTION_NONE', seat, reason: `object_not_usable:${card.id}` });
    return;
  }
  h.objects.splice(objectIdx, 1);
  emit(state, { kind: 'OBJECT_USED', seat, card: card.id, ...(reason ? { reason } : {}) });
  await runOps(state, mkCtx(seat, card.id, 'chasse'), entry.ops);
  discard(state.piles.chasse, card);
  emit(state, { kind: 'DISCARD_CARD', pile: 'chasse', card: card.id, fromSeat: seat });
}

export async function applyPlayerAction(state: GameState, action: PlayerAction): Promise<void> {
  const seat = state.activeSeat;
  // BOSS_007 Azhda actif: the active hero can only draw or exchange this turn.
  const activeHero = state.heroes[seat];
  if (
    activeHero?.onlyDrawThisTurn &&
    action.kind !== 'draw' &&
    action.kind !== 'exchange' &&
    action.kind !== 'none'
  ) {
    emit(state, {
      kind: 'ACTION_NONE',
      seat,
      reason: `restrict_to_draw_or_exchange (Azhda) — ${action.kind} bloqué`,
    });
    action = { kind: 'draw', reason: 'forcé par Azhda' };
  }
  switch (action.kind) {
    case 'draw':
      await doDraw(state, seat, action.reason);
      return;
    case 'useCapacite':
      await doUseCapacite(state, seat);
      return;
    case 'useObject':
      await doUseObject(state, seat, action.objectIdx, action.reason);
      return;
    case 'play': {
      // New rule (2026-04): one Play action = exactly 1 card — either an
      // Action OR an Objet. If both are set (legacy callers), we prefer the
      // Action and emit a warning so bad policies are visible.
      if (action.playAction !== undefined) {
        if (action.placeObject !== undefined) {
          emit(state, {
            kind: 'WARN',
            message: `seat ${seat}: play action posée+jouée simultanément — pose ignorée (nouvelle règle 1 carte)`,
          });
        }
        await playAction(state, seat, action.playAction, action.renforts ?? [], action.reason);
      } else if (action.placeObject !== undefined) {
        placeObject(state, seat, action.placeObject, action.reason);
      }
      return;
    }
    case 'exchange':
      await doExchange(state, seat, action.withSeat, action.give, action.take, action.reason);
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
