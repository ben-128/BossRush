/**
 * Boss end-of-turn sequence resolution.
 *
 * Icons are resolved LEFT TO RIGHT per rules. J2 scope:
 *  - 🃏 menace       → pop one Menace, resolveMenace()
 *  - 🐾 invocation   → pop one Monstre, append to active hero's queue
 *  - ⚔ attaque      → head-of-queue attacks active hero
 *  - ⚡ actif_boss   → NOT_IMPLEMENTED (logged)
 *  - <ico:destin>    → NOT_IMPLEMENTED (logged) — only Invunche uses this
 *
 * Boss passif effects are also NOT_IMPLEMENTED in J2 (one NOT_IMPLEMENTED
 * event is emitted at setup or first use, not every turn, to keep the log
 * readable).
 */

import type { GameState, MonsterInstance } from './gameState.js';
import type { BossIcon } from './events.js';
import { parseBossSequence } from './icons.js';
import { emit, notImplemented } from './logger.js';
import { drawOne, discard } from './piles.js';
import { damageHero, eliminateMonster } from './damage.js';
import { resolveMenace } from './menaces.js';
import { runOps, mkCtx } from './effects.js';
import { hookExtraAttackOrderQueues } from './bossPassifs.js';

function nextInstanceId(state: GameState): string {
  state.counters.monsterInstance += 1;
  return `M${state.counters.monsterInstance}`;
}

/**
 * Draw one monster from the monstre pile and append to the given seat's queue.
 * If the queue belongs to a dead hero, forward to the next living one.
 */
export function summonMonsterInQueue(state: GameState, seat: number): void {
  const m = drawOne(state, state.piles.monstre, 'monstre');
  if (!m) {
    emit(state, { kind: 'WARN', message: 'Monstre pile exhausted — cannot summon' });
    return;
  }

  let targetSeat = seat;
  if (state.heroes[targetSeat]?.dead) {
    for (let offset = 1; offset < state.nPlayers; offset++) {
      const idx = (seat + offset) % state.nPlayers;
      if (!state.heroes[idx]?.dead) {
        targetSeat = idx;
        break;
      }
    }
  }

  const target = state.heroes[targetSeat];
  if (!target) {
    // All heroes dead — monster has nowhere to go, return to discard.
    discard(state.piles.monstre, m);
    return;
  }

  const inst: MonsterInstance = {
    instanceId: nextInstanceId(state),
    cardId: m.id,
    wounds: [],
  };
  target.queue.push(inst);
  emit(state, {
    kind: 'SUMMON_MONSTER',
    instanceId: inst.instanceId,
    cardId: m.id,
    cardName: m.nom,
    seat: targetSeat,
  });
  // onArrive trigger (e.g. Bond goes to head).
  const trig = state.effects[m.id]?.triggers?.onArrive;
  if (trig && trig.length > 0) {
    runOps(state, mkCtx(targetSeat, m.id, 'monstre'), trig);
  }
}

/**
 * Resolve an "ordre d'attaque" (⚔): head-of-queue of the active hero attacks
 * the active hero. If the queue is empty, no effect per rules.
 *
 * The attacking monster card moves from the queue to the hero's wound pile
 * (sa carte passe "sous le héros"). This is NOT an elimination.
 */
export function resolveAttackOrder(state: GameState, seat: number): void {
  const h = state.heroes[seat];
  if (!h) return;
  if (h.dead) {
    emit(state, { kind: 'ATTACK_ORDER', seat, instanceId: null });
    return;
  }
  const head = h.queue[0];
  if (!head) {
    emit(state, { kind: 'ATTACK_ORDER', seat, instanceId: null });
    return;
  }
  const monsterCard = state.catalog.monstreById.get(head.cardId);
  const dmg = monsterCard?.degats ?? 1;

  // onAttack trigger (e.g. Reflux recule en fond de file, n'attaque pas).
  const atkTrig = state.effects[head.cardId]?.triggers?.onAttack;
  if (atkTrig && atkTrig.length > 0) {
    const skip = { cancelled: false };
    // Convention: if the trigger moves this monster away, the attack is
    // considered cancelled for this call.
    runOps(state, mkCtx(seat, head.cardId, 'monstre'), atkTrig);
    // If head changed, the trigger redirected; emit an ATTACK_ORDER log and
    // return — the next queue head (if any) can be tapped by a later call.
    if (h.queue[0]?.instanceId !== head.instanceId) {
      emit(state, { kind: 'ATTACK_ORDER', seat, instanceId: null });
      return;
    }
    void skip;
  }

  emit(state, { kind: 'ATTACK_ORDER', seat, instanceId: head.instanceId });
  emit(state, {
    kind: 'ATTACK',
    src: { kind: 'monster', instanceId: head.instanceId, cardId: head.cardId, seat },
    tgt: { kind: 'hero', seat },
    degats: dmg,
  });

  damageHero(state, seat, {
    amount: dmg,
    source: 'monstre',
    sourceCardId: head.cardId,
  });

  // onDamage trigger (e.g. Brume défausse, Sangsue soigne boss).
  const dmgTrig = state.effects[head.cardId]?.triggers?.onDamage;
  if (dmgTrig && dmgTrig.length > 0) {
    runOps(state, mkCtx(seat, head.cardId, 'monstre'), dmgTrig);
  }

  // The monster dies after executing its attack order.
  eliminateMonster(state, seat, head.instanceId);
}

/** Trigger boss actif (⚡). Uses DSL if present, otherwise logs. */
export function triggerBossActif(state: GameState): void {
  const entry = state.effects[state.boss.bossId];
  if (entry?.actif_ops && entry.actif_ops.length > 0) {
    emit(state, { kind: 'BOSS_ACTIF_TRIGGERED', bossId: state.boss.bossId, implemented: true });
    runOps(state, mkCtx(state.activeSeat, state.boss.bossId, 'boss'), entry.actif_ops);
    return;
  }
  emit(state, { kind: 'BOSS_ACTIF_TRIGGERED', bossId: state.boss.bossId, implemented: false });
  notImplemented(state, 'boss_actif', state.boss.bossId);
}

/** Resolve one icon of the boss sequence. */
function resolveIcon(state: GameState, icon: BossIcon): void {
  emit(state, { kind: 'BOSS_SEQ_ICON', icon });
  switch (icon) {
    case 'menace': {
      const m = drawOne(state, state.piles.menace, 'menace');
      if (!m) {
        emit(state, { kind: 'WARN', message: 'Menace pile exhausted' });
        return;
      }
      resolveMenace(state, m);
      // Menaces are discarded after resolution per standard card game flow.
      discard(state.piles.menace, m);
      return;
    }
    case 'invocation':
      summonMonsterInQueue(state, state.activeSeat);
      return;
    case 'attaque': {
      resolveAttackOrder(state, state.activeSeat);
      for (const extra of hookExtraAttackOrderQueues(state)) {
        resolveAttackOrder(state, extra);
      }
      return;
    }
    case 'actif_boss':
      triggerBossActif(state);
      return;
    case 'destin':
      notImplemented(state, 'boss_sequence_destin_icon', state.boss.bossId);
      return;
    default: {
      const _exhaust: never = icon;
      return _exhaust;
    }
  }
}

/** Resolve the full end-of-turn sequence of the current boss. */
export function resolveBossSequence(state: GameState): void {
  if (state.result !== 'running') return;
  const bossCard = state.catalog.bossById.get(state.boss.bossId);
  if (!bossCard) throw new Error(`Unknown boss id at runtime: ${state.boss.bossId}`);
  const seq = parseBossSequence(bossCard.stats.sequence);
  for (const icon of seq) {
    if (state.result !== 'running') break;
    resolveIcon(state, icon);
  }
}
