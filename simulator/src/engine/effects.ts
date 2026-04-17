/**
 * Effect interpreter.
 *
 * `runOps(state, ctx, ops)` sequentially executes effect operations. If a
 * `require` fails, the whole chain aborts (card "fizzles"). Any RNG-dependent
 * pick goes through the state's PRNG for deterministic replay.
 *
 * The `ctx.sourceCardId` is recorded on emitted Wound records — essential to
 * the log readability (which card did that damage?).
 */

import type { GameState } from './gameState.js';
import type {
  EffectOp,
  HeroTargetTok,
  OpAttack,
  OpChoice,
  OpDamage,
  OpDiscard,
  OpDraw,
  OpDrawDestin,
  OpEliminate,
  OpEliminateWhere,
  OpForEach,
  OpHeal,
  OpModifier,
  OpMoveMonster,
  OpRegenCapacite,
  OpSummon,
} from './effectTypes.js';
import {
  evalCondition,
  resolveDamageTarget,
  resolveHeroTarget,
  resolveMonsterPick,
  resolveQueueDest,
} from './targets.js';
import { healHero } from './heal.js';
import { damageBoss, damageHero, damageMonster, eliminateMonster } from './damage.js';
import { drawOne, discard } from './piles.js';
import { emit } from './logger.js';
import { Rng } from './rng.js';
import type { WoundSource } from './events.js';
import { addModifier } from './modifiers.js';

export interface EffectContext {
  /** Seat that is resolving the effect (plays the card, triggers the ability). */
  sourceSeat: number;
  /** Card id (or synthetic id) that triggered the effect. Logged with wounds. */
  sourceCardId: string;
  /** Category of source — determines wound metadata. */
  sourceKind: WoundSource;
}

export class EffectAborted extends Error {}

export function runOps(state: GameState, ctx: EffectContext, ops: readonly EffectOp[]): void {
  for (const op of ops) {
    if (state.result !== 'running') return;
    try {
      runOne(state, ctx, op);
    } catch (e) {
      if (e instanceof EffectAborted) return;
      throw e;
    }
  }
}

function runOne(state: GameState, ctx: EffectContext, op: EffectOp): void {
  switch (op.op) {
    case 'require':
      if (!evalCondition(state, ctx.sourceSeat, op.cond)) {
        emit(state, { kind: 'WARN', message: `require failed for ${ctx.sourceCardId}` });
        throw new EffectAborted();
      }
      return;
    case 'attack':
    case 'damage':
      return applyDamageOp(state, ctx, op);
    case 'heal':
      return applyHealOp(state, ctx, op);
    case 'draw':
      return applyDrawOp(state, ctx, op);
    case 'drawDestin':
      return applyDrawDestinOp(state, ctx, op);
    case 'summon':
      return applySummonOp(state, ctx, op);
    case 'eliminate':
      return applyEliminateOp(state, ctx, op);
    case 'eliminateWhere':
      return applyEliminateWhereOp(state, ctx, op);
    case 'moveMonster':
      return applyMoveMonsterOp(state, ctx, op);
    case 'regenCapacite':
      return applyRegenCapaciteOp(state, ctx, op);
    case 'discard':
      return applyDiscardOp(state, ctx, op);
    case 'forEach':
      return applyForEachOp(state, ctx, op);
    case 'choice':
      return applyChoiceOp(state, ctx, op);
    case 'modifier':
      return applyModifierOp(state, ctx, op);
    default: {
      const _exhaust: never = op;
      return _exhaust;
    }
  }
}

function applyEliminateWhereOp(
  state: GameState,
  ctx: EffectContext,
  op: OpEliminateWhere,
): void {
  // Collect all matching monsters up front (iteration-safe), then eliminate.
  const matches: { seat: number; instanceId: string }[] = [];
  const heroesToScan =
    op.from === 'monster_in_self_queue'
      ? [state.heroes[ctx.sourceSeat]].filter(Boolean) as NonNullable<typeof state.heroes[number]>[]
      : state.heroes;

  for (const h of heroesToScan) {
    for (const m of h.queue) {
      const card = state.catalog.monstreById.get(m.cardId);
      const vie = card?.vie ?? 1;
      const wounded = m.wounds.reduce((s, w) => s + w.degats, 0);
      const remaining = vie - wounded;
      let ok = true;
      if (op.where === 'has_damage') ok = wounded > 0;
      else if (op.where === 'vie_eq_1') ok = remaining === 1;
      else if (op.where === 'at_most_life_N') ok = remaining <= (op.N ?? 1);
      if (ok) matches.push({ seat: h.seatIdx, instanceId: m.instanceId });
    }
  }
  emit(state, {
    kind: 'WARN',
    message: `eliminateWhere source=${ctx.sourceCardId} from=${op.from} where=${op.where ?? 'none'} matched=${matches.length}`,
  });
  for (const m of matches) eliminateMonster(state, m.seat, m.instanceId);
}

function applyForEachOp(state: GameState, ctx: EffectContext, op: OpForEach): void {
  const seats =
    op.over === 'each_hero'
      ? state.heroes.filter((h) => !h.dead).map((h) => h.seatIdx)
      : state.heroes.filter((h) => !h.dead && h.seatIdx !== ctx.sourceSeat).map((h) => h.seatIdx);
  for (const s of seats) {
    if (state.result !== 'running') return;
    const subCtx: EffectContext = { ...ctx, sourceSeat: s };
    runOps(state, subCtx, op.do);
  }
}

function applyChoiceOp(state: GameState, ctx: EffectContext, op: OpChoice): void {
  // J3.5: choice is resolved by RNG (policy.pickChoice hook comes later).
  // A heuristic layer can override this by pre-selecting an option before
  // runOps is called — for now we record the chosen label for the log.
  const rng = Rng.fromState(state.rngState);
  const idx = rng.nextInt(0, op.options.length - 1);
  state.rngState = rng.state;
  const chosen = op.options[idx];
  if (!chosen) return;
  emit(state, {
    kind: 'WARN',
    message: `choice source=${ctx.sourceCardId} picked=${chosen.label}`,
  });
  runOps(state, ctx, chosen.ops);
}

function applyModifierOp(state: GameState, ctx: EffectContext, op: OpModifier): void {
  // If the effect carries a seat field and we want to anchor it to `self`,
  // rewrite it to the source seat.
  let eff = op.effect;
  if (eff.kind === 'no_damage' && op.target === 'self') {
    eff = { ...eff, seat: ctx.sourceSeat };
  }
  if (eff.kind === 'bonus_damage_next' && op.target === 'self') {
    eff = { ...eff, seat: ctx.sourceSeat };
  }
  const rec = addModifier(state, eff, op.scope, ctx.sourceCardId);
  emit(state, {
    kind: 'WARN',
    message: `modifier_added id=${rec.id} kind=${eff.kind} scope=${op.scope} source=${ctx.sourceCardId}`,
  });
}

// ---------------------------------------------------------------------------
// Individual op handlers
// ---------------------------------------------------------------------------

function applyDamageOp(
  state: GameState,
  ctx: EffectContext,
  op: OpAttack | OpDamage,
): void {
  const amount = op.amount;
  if (op.op === 'damage' && amount === undefined) return;
  const dmg = amount ?? 0;
  if (dmg <= 0) return;

  const targetTok = op.target ?? 'queue_head';
  const target = resolveDamageTarget(state, ctx.sourceSeat, targetTok);
  if (!target) {
    emit(state, { kind: 'WARN', message: `damage: no target resolved for ${ctx.sourceCardId}` });
    return;
  }

  emit(state, {
    kind: 'ATTACK',
    src: { kind: 'hero_action', seat: ctx.sourceSeat, card: ctx.sourceCardId },
    tgt:
      target.kind === 'boss'
        ? { kind: 'boss' }
        : target.kind === 'hero'
          ? { kind: 'hero', seat: target.seat }
          : { kind: 'monster', instanceId: target.instanceId, seat: target.seat },
    degats: dmg,
  });

  const spec = { amount: dmg, source: ctx.sourceKind, sourceCardId: ctx.sourceCardId };
  if (target.kind === 'boss') damageBoss(state, spec);
  else if (target.kind === 'hero') damageHero(state, target.seat, spec);
  else damageMonster(state, target.seat, target.instanceId, spec);
}

function applyHealOp(state: GameState, ctx: EffectContext, op: OpHeal): void {
  const seats = resolveHeroTarget(state, ctx.sourceSeat, op.target);
  for (const s of seats) {
    healHero(state, s, op.amount, ctx.sourceCardId);
  }
}

function applyDrawOp(state: GameState, ctx: EffectContext, op: OpDraw): void {
  const seats = resolveHeroTarget(state, ctx.sourceSeat, op.target);
  for (const s of seats) {
    const h = state.heroes[s];
    if (!h) continue;
    const drew: string[] = [];
    for (let i = 0; i < op.n; i++) {
      const c = drawOne(state, state.piles.chasse, 'chasse');
      if (!c) break;
      h.hand.push(c);
      drew.push(c.id);
      emit(state, { kind: 'DRAW_CARD', pile: 'chasse', card: c.id, toSeat: s });
    }
  }
}

function applyDrawDestinOp(state: GameState, ctx: EffectContext, op: OpDrawDestin): void {
  const n = op.n ?? 1;
  const seats = resolveHeroTarget(state, ctx.sourceSeat, op.target);
  for (const s of seats) {
    for (let i = 0; i < n; i++) {
      const d = drawOne(state, state.piles.destin, 'destin');
      if (!d) break;
      emit(state, { kind: 'DRAW_CARD', pile: 'destin', card: d.id, toSeat: s });
      const entry = state.effects[d.id];
      if (entry) {
        runOps(state, { ...ctx, sourceSeat: s, sourceCardId: d.id, sourceKind: 'destin' }, entry.ops);
      } else {
        // Fallback: apply raw degats if present; otherwise log and discard.
        if (d.degats) {
          damageHero(state, s, { amount: d.degats, source: 'destin', sourceCardId: d.id });
        } else {
          emit(state, { kind: 'NOT_IMPLEMENTED', feature: 'destin_resolve', detail: d.id });
        }
      }
      discard(state.piles.destin, d);
    }
  }
}

function applySummonOp(state: GameState, ctx: EffectContext, op: OpSummon): void {
  const n = op.n ?? 1;
  const seats = resolveHeroTarget(state, ctx.sourceSeat, op.target);
  for (const s of seats) {
    for (let i = 0; i < n; i++) {
      // Inline draw-and-append to avoid circular import with bossSequence.
      const m = drawOne(state, state.piles.monstre, 'monstre');
      if (!m) return;
      state.counters.monsterInstance += 1;
      const inst = {
        instanceId: `M${state.counters.monsterInstance}`,
        cardId: m.id,
        wounds: [] as never[],
      };
      const h = state.heroes[s];
      if (!h) continue;
      h.queue.push(inst);
      emit(state, {
        kind: 'SUMMON_MONSTER',
        instanceId: inst.instanceId,
        cardId: m.id,
        cardName: m.nom,
        seat: s,
      });
    }
  }
}

function applyEliminateOp(state: GameState, ctx: EffectContext, op: OpEliminate): void {
  const ref = resolveMonsterPick(state, ctx.sourceSeat, op.target);
  if (!ref) return;
  eliminateMonster(state, ref.seat, ref.instanceId);
}

function applyMoveMonsterOp(
  state: GameState,
  ctx: EffectContext,
  op: OpMoveMonster,
): void {
  const src = resolveMonsterPick(state, ctx.sourceSeat, op.from);
  if (!src) return;
  const dst = resolveQueueDest(state, ctx.sourceSeat, op.to);
  if (!dst) return;

  const fromHero = state.heroes[src.seat];
  const toHero = state.heroes[dst.seat];
  if (!fromHero || !toHero) return;
  const idx = fromHero.queue.findIndex((m) => m.instanceId === src.instanceId);
  if (idx < 0) return;
  const [moved] = fromHero.queue.splice(idx, 1);
  if (!moved) return;
  if (dst.position === 'head') toHero.queue.unshift(moved);
  else toHero.queue.push(moved);
  emit(state, {
    kind: 'WARN',
    message: `moveMonster ${moved.instanceId} from seat ${src.seat} to seat ${dst.seat} ${dst.position}`,
  });
}

function applyRegenCapaciteOp(
  state: GameState,
  ctx: EffectContext,
  op: OpRegenCapacite,
): void {
  const seats = resolveHeroTarget(state, ctx.sourceSeat, op.target);
  for (const s of seats) {
    const h = state.heroes[s];
    if (!h) continue;
    h.capaciteUsed = false;
    emit(state, { kind: 'WARN', message: `regenCapacite seat=${s} source=${ctx.sourceCardId}` });
  }
}

function applyDiscardOp(state: GameState, ctx: EffectContext, op: OpDiscard): void {
  const seats = resolveHeroTarget(state, ctx.sourceSeat, op.target);
  const rng = Rng.fromState(state.rngState);
  for (const s of seats) {
    const h = state.heroes[s];
    if (!h) continue;
    const n = Math.min(op.n, h.hand.length);
    for (let i = 0; i < n; i++) {
      const idx = op.random ? rng.nextInt(0, h.hand.length - 1) : 0;
      const [card] = h.hand.splice(idx, 1);
      if (!card) break;
      discard(state.piles.chasse, card);
      emit(state, { kind: 'DISCARD_CARD', pile: 'chasse', card: card.id, fromSeat: s });
    }
  }
  state.rngState = rng.state;
  // Consume sourceCardId to satisfy strict-unused-params lint in simple impls.
  void ctx.sourceCardId;
}

// ---------------------------------------------------------------------------
// Helper: produce a context for an arbitrary card use.
// ---------------------------------------------------------------------------

export function mkCtx(
  sourceSeat: number,
  sourceCardId: string,
  sourceKind: WoundSource,
): EffectContext {
  return { sourceSeat, sourceCardId, sourceKind };
}

/**
 * Utility: extract hero target list for use outside the interpreter
 * (e.g. menu in the UI later). Re-exported from targets for convenience.
 */
export function heroTargets(state: GameState, sourceSeat: number, tok: HeroTargetTok): number[] {
  return resolveHeroTarget(state, sourceSeat, tok);
}
