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
  OpBossDamage,
  OpBossHeal,
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
  OpRemoveAllWounds,
  OpRevive,
  OpShiftDamage,
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
import { triggerBossActif, resolveAttackOrder } from './bossSequence.js';
import { applyPlayerAction } from './actions.js';
import { fireReactiveForAll, fireReactiveObjectTriggers } from './reactiveObjects.js';

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
    case 'bossDamage':
      return applyBossDamageOp(state, ctx, op);
    case 'bossHeal':
      return applyBossHealOp(state, ctx, op);
    case 'shiftDamage':
      return applyShiftDamageOp(state, ctx, op);
    case 'removeAllWounds':
      return applyRemoveAllWoundsOp(state, ctx, op);
    case 'revive':
      return applyReviveOp(state, ctx, op);
    case 'cancelMenace':
      state.menaceCancelled = true;
      emit(state, { kind: 'WARN', message: `menace cancelled by ${ctx.sourceCardId}` });
      return;
    case 'playMoreActions': {
      // Re-invoke the active hero's policy for N extra decisions — synchronous
      // so the extra actions resolve BEFORE the rest of the current op chain.
      const policy = state.policies[ctx.sourceSeat];
      if (!policy) return;
      for (let i = 0; i < op.n; i++) {
        if (state.result !== 'running') break;
        const action = policy.pickAction(state);
        if (op.restrictTo === 'play_action_only' && action.kind !== 'play') {
          // Nothing more to play — stop rather than burning iterations.
          break;
        }
        applyPlayerAction(state, action);
      }
      return;
    }
    case 'openFreeExchange': {
      // Policy-driven free exchange window. Simple implementation: for up to
      // maxSwaps, let each living hero (other than active) offer one card;
      // the active hero takes it if their hand has room. This is a loose
      // stand-in for "échanges libres" until a dedicated multi-hero flow is
      // wired. Log the action for visibility.
      const max = op.maxSwaps ?? 3;
      const active = state.heroes[ctx.sourceSeat];
      if (!active) return;
      let done = 0;
      for (const other of state.heroes) {
        if (done >= max) break;
        if (other.dead || other.seatIdx === ctx.sourceSeat) continue;
        if (other.hand.length === 0 || active.hand.length === 0) continue;
        // Trade one card per pair.
        const given = active.hand.shift()!;
        const received = other.hand.shift()!;
        active.hand.push(received);
        other.hand.push(given);
        emit(state, {
          kind: 'ACTION_EXCHANGE',
          seat: ctx.sourceSeat,
          withSeat: other.seatIdx,
          given: [given.id],
          received: [received.id],
        });
        done++;
      }
      return;
    }
    case 'bossActif':
      triggerBossActif(state);
      return;
    case 'ignorePrereqNext': {
      const h = state.heroes[ctx.sourceSeat];
      if (h) {
        h.nextActionIgnoresPrereq = true;
        emit(state, {
          kind: 'WARN',
          message: `ignorePrereqNext set on seat ${ctx.sourceSeat} by ${ctx.sourceCardId}`,
        });
      }
      return;
    }
    case 'drawPerSelfWound': {
      const h = state.heroes[ctx.sourceSeat];
      if (!h) return;
      const n = h.wounds.reduce((s, w) => s + w.degats, 0);
      if (n === 0) return;
      for (let i = 0; i < n; i++) {
        const c = drawOne(state, state.piles.chasse, 'chasse');
        if (!c) break;
        h.hand.push(c);
        emit(state, { kind: 'DRAW_CARD', pile: 'chasse', card: c.id, toSeat: ctx.sourceSeat });
      }
      return;
    }
    case 'rallyToSelf': {
      const self = state.heroes[ctx.sourceSeat];
      if (!self) return;
      for (const other of state.heroes) {
        if (other.dead || other.seatIdx === ctx.sourceSeat) continue;
        while (other.queue.length > 0) {
          const moved = other.queue.shift()!;
          self.queue.push(moved);
          emit(state, {
            kind: 'MONSTER_MOVED',
            instanceId: moved.instanceId,
            cardId: moved.cardId,
            fromSeat: other.seatIdx,
            toSeat: ctx.sourceSeat,
            position: 'tail',
            sourceCardId: ctx.sourceCardId,
          });
        }
      }
      return;
    }
    case 'giveCardsFromAllies': {
      const self = state.heroes[ctx.sourceSeat];
      if (!self) return;
      const selfNom = state.catalog.heroesById.get(self.heroId)?.nom;
      for (const ally of state.heroes) {
        if (ally.dead || ally.seatIdx === ctx.sourceSeat) continue;
        if (ally.hand.length === 0) continue;
        // Prefer a card whose prereq matches self (mutually beneficial).
        let idx = selfNom ? ally.hand.findIndex((c) => c.prerequis === selfNom) : -1;
        if (idx === -1) idx = 0;
        const [card] = ally.hand.splice(idx, 1);
        if (card) {
          self.hand.push(card);
          emit(state, {
            kind: 'ACTION_EXCHANGE',
            seat: ctx.sourceSeat,
            withSeat: ally.seatIdx,
            given: [],
            received: [card.id],
            reason: `don via ${ctx.sourceCardId}`,
          });
        }
      }
      return;
    }
    case 'giveCardsToAllies': {
      const self = state.heroes[ctx.sourceSeat];
      if (!self) return;
      for (const ally of state.heroes) {
        if (ally.dead || ally.seatIdx === ctx.sourceSeat) continue;
        if (self.hand.length === 0) break;
        const allyNom = state.catalog.heroesById.get(ally.heroId)?.nom;
        // Prefer a card whose prereq matches the ally (they'll use it).
        let idx = allyNom ? self.hand.findIndex((c) => c.prerequis === allyNom) : -1;
        if (idx === -1) idx = 0;
        const [card] = self.hand.splice(idx, 1);
        if (card) {
          ally.hand.push(card);
          emit(state, {
            kind: 'ACTION_EXCHANGE',
            seat: ctx.sourceSeat,
            withSeat: ally.seatIdx,
            given: [card.id],
            received: [],
            reason: `don via ${ctx.sourceCardId}`,
          });
        }
      }
      return;
    }
    case 'grantExtraPose': {
      const h = state.heroes[ctx.sourceSeat];
      if (h) h.extraPoseAvailable = true;
      return;
    }
    case 'swapHandWithAlly': {
      const self = state.heroes[ctx.sourceSeat];
      if (!self) return;
      const selfNom = state.catalog.heroesById.get(self.heroId)?.nom;
      // Pick the best ally: one whose hand contains a card matching self AND
      // where self has a card matching them. Fallback: first living ally.
      let bestAlly: typeof self | undefined;
      let bestGive = -1;
      let bestTake = -1;
      for (const ally of state.heroes) {
        if (ally.dead || ally.seatIdx === ctx.sourceSeat) continue;
        const allyNom = state.catalog.heroesById.get(ally.heroId)?.nom;
        if (!allyNom || !selfNom) continue;
        const giveIdx = self.hand.findIndex((c) => c.prerequis === allyNom);
        const takeIdx = ally.hand.findIndex((c) => c.prerequis === selfNom);
        if (giveIdx !== -1 && takeIdx !== -1) {
          bestAlly = ally;
          bestGive = giveIdx;
          bestTake = takeIdx;
          break;
        }
      }
      if (!bestAlly) {
        for (const ally of state.heroes) {
          if (ally.dead || ally.seatIdx === ctx.sourceSeat) continue;
          if (ally.hand.length === 0 || self.hand.length === 0) continue;
          bestAlly = ally;
          bestGive = 0;
          bestTake = 0;
          break;
        }
      }
      if (!bestAlly) return;
      const [given] = self.hand.splice(bestGive, 1);
      const [received] = bestAlly.hand.splice(bestTake, 1);
      if (given) bestAlly.hand.push(given);
      if (received) self.hand.push(received);
      emit(state, {
        kind: 'ACTION_EXCHANGE',
        seat: ctx.sourceSeat,
        withSeat: bestAlly.seatIdx,
        given: given ? [given.id] : [],
        received: received ? [received.id] : [],
        reason: `swap via ${ctx.sourceCardId}`,
      });
      return;
    }
    case 'swapObjectsWithAlly': {
      const self = state.heroes[ctx.sourceSeat];
      if (!self) return;
      // Pick the ally whose posed objects would best fit self's prereq, and
      // whose prereq matches our posed objects.
      const selfNom = state.catalog.heroesById.get(self.heroId)?.nom;
      let bestAlly: typeof self | undefined;
      for (const ally of state.heroes) {
        if (ally.dead || ally.seatIdx === ctx.sourceSeat) continue;
        if (ally.objects.length === 0 && self.objects.length === 0) continue;
        const allyNom = state.catalog.heroesById.get(ally.heroId)?.nom;
        const mineForAlly = self.objects.some((c) => c.prerequis === allyNom);
        const allyForMine = ally.objects.some((c) => c.prerequis === selfNom);
        if (mineForAlly || allyForMine) {
          bestAlly = ally;
          break;
        }
      }
      if (!bestAlly) return;
      const given = self.objects.splice(0, self.objects.length);
      const received = bestAlly.objects.splice(0, bestAlly.objects.length);
      self.objects.push(...received);
      bestAlly.objects.push(...given);
      emit(state, {
        kind: 'ACTION_EXCHANGE',
        seat: ctx.sourceSeat,
        withSeat: bestAlly.seatIdx,
        given: given.map((c) => c.id),
        received: received.map((c) => c.id),
        reason: `swap objets posés via ${ctx.sourceCardId}`,
      });
      return;
    }
    case 'giftCardsToAlly': {
      const self = state.heroes[ctx.sourceSeat];
      if (!self) return;
      // Pick the ally who benefits most: greatest count of self's cards
      // matching their prereq.
      let bestAlly: typeof self | undefined;
      let bestCount = 0;
      for (const ally of state.heroes) {
        if (ally.dead || ally.seatIdx === ctx.sourceSeat) continue;
        const allyNom = state.catalog.heroesById.get(ally.heroId)?.nom;
        if (!allyNom) continue;
        const n = self.hand.filter((c) => c.prerequis === allyNom).length;
        if (n > bestCount) {
          bestCount = n;
          bestAlly = ally;
        }
      }
      if (!bestAlly || bestCount === 0) return;
      const allyNom = state.catalog.heroesById.get(bestAlly.heroId)!.nom;
      const given: string[] = [];
      let transferred = 0;
      for (let i = self.hand.length - 1; i >= 0 && transferred < op.n; i--) {
        if (self.hand[i]!.prerequis !== allyNom) continue;
        const [c] = self.hand.splice(i, 1);
        if (c) {
          bestAlly.hand.push(c);
          given.push(c.id);
          transferred++;
        }
      }
      emit(state, {
        kind: 'ACTION_EXCHANGE',
        seat: ctx.sourceSeat,
        withSeat: bestAlly.seatIdx,
        given,
        received: [],
        reason: `don ×${transferred} via ${ctx.sourceCardId}`,
      });
      if (op.healPerCard && transferred > 0) {
        const budget = op.healPerCard * transferred;
        // Reuse OpHeal logic inline: bottom-up wound removal.
        let rem = budget;
        for (let i = self.wounds.length - 1; i >= 0 && rem > 0; ) {
          const w = self.wounds[i]!;
          if (w.degats <= rem) {
            rem -= w.degats;
            self.wounds.splice(i, 1);
          } else break;
          i--;
        }
      }
      return;
    }
    case 'attackChain': {
      const self = state.heroes[ctx.sourceSeat];
      if (!self) return;
      let amount = op.amount;
      // Chain as long as the current queue head dies.
      while (amount > 0) {
        const head = self.queue[0];
        if (!head) {
          // No monster → boss takes remainder.
          damageBoss(state, { amount, source: ctx.sourceKind, sourceCardId: ctx.sourceCardId });
          return;
        }
        const before = head.wounds.reduce((s, w) => s + w.degats, 0);
        damageMonster(state, self.seatIdx, head.instanceId, {
          amount,
          source: ctx.sourceKind,
          sourceCardId: ctx.sourceCardId,
        });
        // Did the monster die? If it's still in queue, no chain.
        if (self.queue[0]?.instanceId === head.instanceId) return;
        // Otherwise consume the damage portion already spent and continue.
        const card = state.catalog.monstreById.get(head.cardId);
        const spent = (card?.vie ?? 1) - before;
        amount = Math.max(0, amount - spent);
      }
      return;
    }
    case 'healEqualsActionsThisTurn': {
      const h = state.heroes[ctx.sourceSeat];
      if (!h) return;
      const n = h.actionsPlayedThisTurn ?? 0;
      if (n > 0) runOps(state, ctx, [{ op: 'heal', target: 'self', amount: n }]);
      return;
    }
    case 'healEqualsSelfQueueSize': {
      const h = state.heroes[ctx.sourceSeat];
      if (!h) return;
      const n = h.queue.length;
      if (n > 0) runOps(state, ctx, [{ op: 'heal', target: 'self', amount: n }]);
      return;
    }
    case 'healEqualsDrawsThisTurn': {
      const h = state.heroes[ctx.sourceSeat];
      if (!h) return;
      const n = h.drawsThisTurn ?? 0;
      if (n > 0) runOps(state, ctx, [{ op: 'heal', target: 'self', amount: n }]);
      return;
    }
    case 'eliminateIfActionsThisTurn': {
      const h = state.heroes[ctx.sourceSeat];
      if (!h) return;
      if ((h.actionsPlayedThisTurn ?? 0) < op.minActions) return;
      runOps(state, ctx, [{ op: 'eliminate', target: { pick: op.from } }]);
      return;
    }
    case 'drawFromDiscard': {
      const seats = resolveHeroTarget(state, ctx.sourceSeat, op.target);
      for (const s of seats) {
        const h = state.heroes[s];
        if (!h || h.dead) continue;
        for (let i = 0; i < op.n; i++) {
          // Pull from the discard pile; if empty, fall back to regular draw.
          let c = state.piles.chasse.discard.pop();
          if (!c) c = drawOne(state, state.piles.chasse, 'chasse');
          if (!c) break;
          h.hand.push(c);
          emit(state, { kind: 'DRAW_CARD', pile: 'chasse', card: c.id, toSeat: s });
        }
      }
      return;
    }
    case 'redistributeWounds': {
      const living = state.heroes.filter((hh) => !hh.dead);
      if (living.length === 0) return;
      const totalDegats = living.reduce(
        (s, hh) => s + hh.wounds.reduce((a, w) => a + w.degats, 0),
        0,
      );
      const per = Math.floor(totalDegats / living.length);
      let remainder = totalDegats - per * living.length;
      for (const hh of living) {
        hh.wounds = [];
        const deg = per + (remainder > 0 ? 1 : 0);
        if (remainder > 0) remainder--;
        if (deg > 0) {
          hh.wounds.push({
            woundId: `W_RED_${ctx.sourceCardId}_${hh.seatIdx}_${state.counters.event}`,
            source: ctx.sourceKind,
            sourceCardId: ctx.sourceCardId,
            degats: deg,
          });
        }
      }
      emit(state, { kind: 'WARN', message: `redistributeWounds ${totalDegats} → ${per}/hero` });
      return;
    }
    case 'discardObject': {
      const h = state.heroes[ctx.sourceSeat];
      if (!h) return;
      for (let i = 0; i < op.n && h.objects.length > 0; i++) {
        const obj = h.objects.shift()!;
        discard(state.piles.chasse, obj);
        emit(state, { kind: 'DISCARD_CARD', pile: 'chasse', card: obj.id, fromSeat: ctx.sourceSeat });
      }
      return;
    }
    case 'restrictToDraw': {
      const h = state.heroes[ctx.sourceSeat];
      if (h) h.onlyDrawThisTurn = true;
      return;
    }
    case 'rallyHeadsToSelf': {
      const self = state.heroes[ctx.sourceSeat];
      if (!self) return;
      let moved = 0;
      for (const other of state.heroes) {
        if (moved >= op.max) break;
        if (other.dead || other.seatIdx === ctx.sourceSeat) continue;
        const head = other.queue.shift();
        if (!head) continue;
        self.queue.push(head);
        emit(state, {
          kind: 'MONSTER_MOVED',
          instanceId: head.instanceId,
          cardId: head.cardId,
          fromSeat: other.seatIdx,
          toSeat: ctx.sourceSeat,
          position: 'tail',
          sourceCardId: ctx.sourceCardId,
        });
        moved++;
      }
      return;
    }
    case 'drawUpTo': {
      const h = state.heroes[ctx.sourceSeat];
      if (!h) return;
      while (h.hand.length < op.n) {
        const c = drawOne(state, state.piles.chasse, 'chasse');
        if (!c) break;
        h.hand.push(c);
        emit(state, { kind: 'DRAW_CARD', pile: 'chasse', card: c.id, toSeat: ctx.sourceSeat });
      }
      return;
    }
    case 'eliminateAllyHead': {
      // Pick ally whose head has the most wounds (finish it off) or first alive.
      let bestAlly: typeof state.heroes[number] | undefined;
      for (const ally of state.heroes) {
        if (ally.dead || ally.seatIdx === ctx.sourceSeat) continue;
        if (ally.queue.length === 0) continue;
        bestAlly = ally;
        break;
      }
      if (!bestAlly) return;
      const head = bestAlly.queue[0]!;
      eliminateMonster(state, bestAlly.seatIdx, head.instanceId);
      return;
    }
    case 'reassignHeadToBoss': {
      // Pick any queue head; use that monster's degats as boss damage, then
      // the monster dies (attacking consumes it).
      for (const h of state.heroes) {
        if (h.dead || h.queue.length === 0) continue;
        const head = h.queue[0]!;
        const card = state.catalog.monstreById.get(head.cardId);
        const amount = card?.degats ?? card?.vie ?? 1;
        emit(state, {
          kind: 'ATTACK',
          src: { kind: 'monster', instanceId: head.instanceId, cardId: head.cardId, seat: h.seatIdx },
          tgt: { kind: 'boss' },
          degats: amount,
        });
        damageBoss(state, { amount, source: ctx.sourceKind, sourceCardId: ctx.sourceCardId });
        eliminateMonster(state, h.seatIdx, head.instanceId);
        return;
      }
      return;
    }
    case 'healAllyEqualsSelfWounds': {
      const self = state.heroes[ctx.sourceSeat];
      if (!self) return;
      const n = self.wounds.reduce((s, w) => s + w.degats, 0);
      if (n === 0) return;
      runOps(state, ctx, [{ op: 'heal', target: 'any_ally', amount: n }]);
      return;
    }
    case 'drawWithObjetBonus': {
      const h = state.heroes[ctx.sourceSeat];
      if (!h) return;
      const first = drawOne(state, state.piles.chasse, 'chasse');
      if (!first) return;
      h.hand.push(first);
      emit(state, { kind: 'DRAW_CARD', pile: 'chasse', card: first.id, toSeat: ctx.sourceSeat });
      if (first.categorie === 'objet') {
        const extra = drawOne(state, state.piles.chasse, 'chasse');
        if (extra) {
          h.hand.push(extra);
          emit(state, { kind: 'DRAW_CARD', pile: 'chasse', card: extra.id, toSeat: ctx.sourceSeat });
        }
      }
      return;
    }
    case 'damageIfHealed': {
      if (!state.healedThisTurn) return;
      runOps(state, ctx, [{ op: 'damage', target: 'queue_head', amount: op.amount }]);
      return;
    }
    case 'setChainOnKill': {
      const h = state.heroes[ctx.sourceSeat];
      if (h) h.chainAttackOnKill = true;
      return;
    }
    case 'cancelDestin':
      state.destinCancelled = true;
      return;
    case 'eliminateAllInHeroQueue': {
      const seats = resolveHeroTarget(state, ctx.sourceSeat, op.target);
      for (const s of seats) {
        const h = state.heroes[s];
        if (!h) continue;
        // Iterate a snapshot — eliminateMonster mutates h.queue.
        const ids = h.queue.map((m) => m.instanceId);
        for (const id of ids) eliminateMonster(state, s, id);
      }
      return;
    }
    case 'removeLastWound': {
      const h = state.heroes[ctx.sourceSeat];
      if (!h || h.wounds.length === 0) return;
      h.wounds.pop();
      emit(state, { kind: 'WARN', message: `removeLastWound seat=${ctx.sourceSeat} via ${ctx.sourceCardId}` });
      return;
    }
    case 'summonOnEmptyQueues': {
      for (const hh of state.heroes) {
        if (hh.dead || hh.queue.length > 0) continue;
        const m = drawOne(state, state.piles.monstre, 'monstre');
        if (!m) break;
        state.counters.monsterInstance += 1;
        const inst = {
          instanceId: `M${state.counters.monsterInstance}`,
          cardId: m.id,
          wounds: [] as never[],
        };
        hh.queue.push(inst);
        emit(state, {
          kind: 'SUMMON_MONSTER',
          instanceId: inst.instanceId,
          cardId: m.id,
          cardName: m.nom,
          seat: hh.seatIdx,
        });
      }
      return;
    }
    case 'rotateHeadsToNext': {
      // Snapshot each living hero's head first, then apply all moves so
      // monsters that "land" during the rotation don't get re-moved.
      const plan: Array<{ fromSeat: number; toSeat: number; head: { instanceId: string; cardId: string } }> = [];
      for (const hh of state.heroes) {
        if (hh.dead || hh.queue.length === 0) continue;
        const head = hh.queue[0]!;
        // Find the next living hero clockwise.
        let toSeat = -1;
        for (let offset = 1; offset <= state.nPlayers; offset++) {
          const idx = (hh.seatIdx + offset) % state.nPlayers;
          const other = state.heroes[idx];
          if (other && !other.dead) {
            toSeat = idx;
            break;
          }
        }
        if (toSeat === -1 || toSeat === hh.seatIdx) continue;
        plan.push({ fromSeat: hh.seatIdx, toSeat, head: { instanceId: head.instanceId, cardId: head.cardId } });
      }
      for (const p of plan) {
        const src = state.heroes[p.fromSeat]!;
        const dst = state.heroes[p.toSeat]!;
        const idx = src.queue.findIndex((m) => m.instanceId === p.head.instanceId);
        if (idx < 0) continue;
        const [moved] = src.queue.splice(idx, 1);
        if (!moved) continue;
        dst.queue.push(moved);
        emit(state, {
          kind: 'MONSTER_MOVED',
          instanceId: moved.instanceId,
          cardId: moved.cardId,
          fromSeat: p.fromSeat,
          toSeat: p.toSeat,
          position: 'tail',
          sourceCardId: ctx.sourceCardId,
        });
      }
      return;
    }
    case 'allyPlaysAction': {
      // Find a living ally, run their policy for 1 action (action-only).
      for (const ally of state.heroes) {
        if (ally.dead || ally.seatIdx === ctx.sourceSeat) continue;
        const policy = state.policies[ally.seatIdx];
        if (!policy) continue;
        const saved = state.activeSeat;
        state.activeSeat = ally.seatIdx;
        const act = policy.pickAction(state);
        if (act.kind === 'play') applyPlayerAction(state, act);
        state.activeSeat = saved;
        return;
      }
      return;
    }
    case 'scoutSolo': {
      const h = state.heroes[ctx.sourceSeat];
      if (!h) return;
      const actionIdx = h.hand
        .map((c, i) => (c.categorie === 'action' ? i : -1))
        .filter((i) => i !== -1);
      if (actionIdx.length >= 2) {
        // Discard 2 Actions then draw 2.
        for (const i of actionIdx.slice(0, 2).sort((a, b) => b - a)) {
          const [c] = h.hand.splice(i, 1);
          if (c) {
            discard(state.piles.chasse, c);
            emit(state, { kind: 'DISCARD_CARD', pile: 'chasse', card: c.id, fromSeat: ctx.sourceSeat });
          }
        }
        for (let k = 0; k < 2; k++) {
          const c = drawOne(state, state.piles.chasse, 'chasse');
          if (!c) break;
          h.hand.push(c);
          emit(state, { kind: 'DRAW_CARD', pile: 'chasse', card: c.id, toSeat: ctx.sourceSeat });
        }
      } else {
        runOps(state, ctx, [{ op: 'damage', target: 'active_hero', amount: 1 }]);
      }
      return;
    }
    case 'discardHandDrawSame': {
      const h = state.heroes[ctx.sourceSeat];
      if (!h) return;
      const n = h.hand.length;
      while (h.hand.length > 0) {
        const c = h.hand.shift()!;
        discard(state.piles.chasse, c);
        emit(state, { kind: 'DISCARD_CARD', pile: 'chasse', card: c.id, fromSeat: ctx.sourceSeat });
      }
      for (let i = 0; i < n; i++) {
        const c = drawOne(state, state.piles.chasse, 'chasse');
        if (!c) break;
        h.hand.push(c);
        emit(state, { kind: 'DRAW_CARD', pile: 'chasse', card: c.id, toSeat: ctx.sourceSeat });
      }
      return;
    }
    case 'scryChasse': {
      const h = state.heroes[ctx.sourceSeat];
      if (!h) return;
      const looked: typeof state.piles.chasse.draw = [];
      for (let i = 0; i < op.look; i++) {
        const c = state.piles.chasse.draw.shift();
        if (!c) break;
        looked.push(c);
      }
      // Keep the first `keep` cards whose prereq matches self (if possible).
      const selfNom = state.catalog.heroesById.get(h.heroId)?.nom;
      const scored = looked
        .map((c, idx) => ({ c, idx, score: c.prerequis === selfNom ? 2 : (c.degats ?? 0) > 0 ? 1 : 0 }))
        .sort((a, b) => b.score - a.score);
      const kept = scored.slice(0, op.keep).map((x) => x.c);
      const rest = scored.slice(op.keep).map((x) => x.c);
      // Kept cards go into hand; rest goes to discard.
      for (const c of kept) {
        h.hand.push(c);
        emit(state, { kind: 'DRAW_CARD', pile: 'chasse', card: c.id, toSeat: ctx.sourceSeat });
      }
      for (const c of rest) {
        state.piles.chasse.discard.push(c);
        emit(state, { kind: 'DISCARD_CARD', pile: 'chasse', card: c.id });
      }
      return;
    }
    case 'attackOrder': {
      if (op.target === 'self') {
        resolveAttackOrder(state, ctx.sourceSeat);
      } else {
        for (const h of state.heroes) {
          if (h.dead) continue;
          resolveAttackOrder(state, h.seatIdx);
        }
      }
      return;
    }
    case 'moveSelfMonsterToHead': {
      // Find the newest-added instance of ctx.sourceCardId in the source
      // seat's queue and bubble it to index 0.
      const h = state.heroes[ctx.sourceSeat];
      if (!h) return;
      for (let i = h.queue.length - 1; i >= 0; i--) {
        if (h.queue[i]!.cardId === ctx.sourceCardId) {
          const [inst] = h.queue.splice(i, 1);
          if (inst) {
            h.queue.unshift(inst);
            emit(state, {
              kind: 'MONSTER_MOVED',
              instanceId: inst.instanceId,
              cardId: inst.cardId,
              fromSeat: ctx.sourceSeat,
              toSeat: ctx.sourceSeat,
              position: 'head',
              sourceCardId: ctx.sourceCardId,
            });
          }
          break;
        }
      }
      return;
    }
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
  const who = op.who ?? 'active';
  const decidingSeat =
    who === 'active'
      ? ctx.sourceSeat
      : (state.heroes.find((h) => !h.dead)?.seatIdx ?? ctx.sourceSeat);

  // Ask policy first; fall back to RNG.
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const policy = state.policies[decidingSeat] as any;
  let idx: number;
  if (policy && typeof policy.pickChoice === 'function') {
    idx = policy.pickChoice(state, decidingSeat, ctx.sourceCardId, op.options);
    if (!Number.isInteger(idx) || idx < 0 || idx >= op.options.length) {
      idx = 0;
    }
  } else {
    const rng = Rng.fromState(state.rngState);
    idx = rng.nextInt(0, op.options.length - 1);
    state.rngState = rng.state;
  }
  const chosen = op.options[idx];
  if (!chosen) return;
  emit(state, {
    kind: 'CHOICE_MADE',
    sourceCardId: ctx.sourceCardId,
    seat: decidingSeat,
    label: chosen.label,
  });
  runOps(state, ctx, chosen.ops);
}

function applyBossDamageOp(state: GameState, ctx: EffectContext, op: OpBossDamage): void {
  damageBoss(state, { amount: op.amount, source: ctx.sourceKind, sourceCardId: ctx.sourceCardId });
}

function applyBossHealOp(state: GameState, _ctx: EffectContext, op: OpBossHeal): void {
  // Remove up to N total damage from the boss, bottom-up (most recent first).
  let budget = op.amount;
  const stack = state.boss.wounds;
  for (let i = stack.length - 1; i >= 0 && budget > 0; ) {
    const w = stack[i]!;
    if (w.degats <= budget) {
      stack.splice(i, 1);
      budget -= w.degats;
      i--;
    } else {
      i--;
    }
  }
  emit(state, { kind: 'WARN', message: `boss healed for up to ${op.amount}` });
}

function applyShiftDamageOp(state: GameState, ctx: EffectContext, op: OpShiftDamage): void {
  // Pick a source hero (most wounded among 'from' token semantics).
  let fromSeat: number | undefined;
  if (op.from === 'self') fromSeat = ctx.sourceSeat;
  else {
    const pool = state.heroes.filter(
      (h) =>
        !h.dead && (op.from === 'any_hero' ? true : h.seatIdx !== ctx.sourceSeat),
    );
    // Pick most wounded.
    pool.sort(
      (a, b) =>
        b.wounds.reduce((s, w) => s + w.degats, 0) - a.wounds.reduce((s, w) => s + w.degats, 0),
    );
    fromSeat = pool[0]?.seatIdx;
  }
  if (fromSeat === undefined) return;
  const source = state.heroes[fromSeat];
  if (!source) return;

  // Pull up to `amount` worth of wound cards from newest to oldest.
  const moved: typeof source.wounds = [];
  let remaining = op.amount;
  for (let i = source.wounds.length - 1; i >= 0 && remaining > 0; ) {
    const w = source.wounds[i]!;
    if (w.degats <= remaining) {
      moved.push(w);
      source.wounds.splice(i, 1);
      remaining -= w.degats;
      i--;
    } else {
      i--;
    }
  }
  if (moved.length === 0) return;

  // Resolve destination and re-apply damage events.
  const replaySpec = (targetKind: 'hero' | 'boss' | 'monster', targetSeat?: number, instanceId?: string) => {
    for (const w of moved) {
      if (targetKind === 'boss') {
        damageBoss(state, { amount: w.degats, source: ctx.sourceKind, sourceCardId: ctx.sourceCardId });
      } else if (targetKind === 'hero' && targetSeat !== undefined) {
        damageHero(state, targetSeat, { amount: w.degats, source: ctx.sourceKind, sourceCardId: ctx.sourceCardId });
      } else if (targetKind === 'monster' && targetSeat !== undefined && instanceId) {
        // Guard: if the monster was eliminated by a previous iteration, stop.
        const th = state.heroes[targetSeat];
        const stillAlive = !!th?.queue.find((m) => m.instanceId === instanceId);
        if (!stillAlive) {
          // Redirect remaining damage to the boss as a sensible fallback.
          damageBoss(state, { amount: w.degats, source: ctx.sourceKind, sourceCardId: ctx.sourceCardId });
        } else {
          damageMonster(state, targetSeat, instanceId, {
            amount: w.degats,
            source: ctx.sourceKind,
            sourceCardId: ctx.sourceCardId,
          });
        }
      }
    }
  };

  if (op.to === 'self') replaySpec('hero', ctx.sourceSeat);
  else if (op.to === 'boss') replaySpec('boss');
  else if (op.to === 'any_hero' || op.to === 'any_ally') {
    const candidates = state.heroes.filter(
      (h) => !h.dead && (op.to === 'any_hero' || h.seatIdx !== ctx.sourceSeat),
    );
    candidates.sort(
      (a, b) =>
        a.wounds.reduce((s, w) => s + w.degats, 0) - b.wounds.reduce((s, w) => s + w.degats, 0),
    );
    const pick = candidates[0];
    if (pick) replaySpec('hero', pick.seatIdx);
  } else if (op.to === 'queue_head') {
    const h = state.heroes[ctx.sourceSeat];
    const head = h?.queue[0];
    if (head) replaySpec('monster', ctx.sourceSeat, head.instanceId);
    else replaySpec('boss');
  } else {
    // MonsterPick
    const mp = resolveMonsterPick(state, ctx.sourceSeat, op.to);
    if (mp) replaySpec('monster', mp.seat, mp.instanceId);
  }
}

function applyRemoveAllWoundsOp(state: GameState, _ctx: EffectContext, op: OpRemoveAllWounds): void {
  const seats = resolveHeroTarget(state, _ctx.sourceSeat, op.target);
  for (const s of seats) {
    const h = state.heroes[s];
    if (!h) continue;
    const before = h.wounds.length;
    h.wounds = [];
    emit(state, { kind: 'WARN', message: `removeAllWounds seat=${s} cleared=${before}` });
  }
}

function applyReviveOp(state: GameState, ctx: EffectContext, op: OpRevive): void {
  const dead = state.heroes.filter((h) => h.dead);
  if (dead.length === 0) return;
  // Pick first dead (deterministic). Could route via policy later.
  const h = dead[0]!;
  h.dead = false;
  h.wounds = [];
  emit(state, { kind: 'WARN', message: `revive seat=${h.seatIdx} by ${ctx.sourceCardId}` });
  if (op.heal && op.heal > 0) {
    // Since we just cleared wounds, heal adds nothing, but we log intent.
    emit(state, { kind: 'WARN', message: `revive-heal seat=${h.seatIdx} amount=${op.heal}` });
  }
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
  else {
    const killed = damageMonster(state, target.seat, target.instanceId, spec);
    // ROD_O02 chain-on-kill: if renfort flag is set and the attack killed a
    // monster in the source's own queue, continue the attack onto the new
    // head (or boss if queue empty). One-shot.
    const src = state.heroes[ctx.sourceSeat];
    if (killed && src?.chainAttackOnKill && target.seat === ctx.sourceSeat) {
      src.chainAttackOnKill = false;
      const nextHead = src.queue[0];
      if (nextHead) {
        emit(state, {
          kind: 'ATTACK',
          src: { kind: 'hero_action', seat: ctx.sourceSeat, card: ctx.sourceCardId },
          tgt: { kind: 'monster', instanceId: nextHead.instanceId, seat: ctx.sourceSeat },
          degats: dmg,
        });
        damageMonster(state, ctx.sourceSeat, nextHead.instanceId, spec);
      } else {
        emit(state, {
          kind: 'ATTACK',
          src: { kind: 'hero_action', seat: ctx.sourceSeat, card: ctx.sourceCardId },
          tgt: { kind: 'boss' },
          degats: dmg,
        });
        damageBoss(state, spec);
      }
    }
  }
}

function applyHealOp(state: GameState, ctx: EffectContext, op: OpHeal): void {
  const seats = resolveHeroTarget(state, ctx.sourceSeat, op.target);
  let healedAnyAlly = false;
  for (const s of seats) {
    const healed = healHero(state, s, op.amount, ctx.sourceCardId);
    if (healed > 0 && s !== ctx.sourceSeat) healedAnyAlly = true;
  }
  // Reactive: if this hero healed at least one ally, fire on_self_heals_ally.
  if (healedAnyAlly) {
    fireReactiveObjectTriggers(state, 'on_self_heals_ally', ctx.sourceSeat);
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
      emit(state, { kind: 'RESOLVE_DESTIN', card: d.id, toSeat: s });
      // Reactive posed objects (SOI_O03 Gemme de communion) can interrupt.
      state.destinCancelled = false;
      fireReactiveForAll(state, 'on_destin_drawn_any');
      if (state.destinCancelled) {
        discard(state.piles.destin, d);
        continue;
      }
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
    kind: 'MONSTER_MOVED',
    instanceId: moved.instanceId,
    cardId: moved.cardId,
    fromSeat: src.seat,
    toSeat: dst.seat,
    position: dst.position,
    sourceCardId: ctx.sourceCardId,
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
