/**
 * Damage application.
 *
 * Rules recap (see REGLES_RESUME.md § Subir des dégâts):
 *  - Wound card is stacked UNDER the pile → array append at the END.
 *  - Target is dead/eliminated when sum(wounds.degats) ≥ vieMax.
 *  - Monster elimination sends the card to the monstre discard and triggers
 *    "quand ce monstre est éliminé" effects (not yet implemented in J2).
 *  - When a hero dies, all monsters of his queue join the NEXT living hero's
 *    queue (clockwise) at the end. His objects are... unspecified in rules;
 *    for J2 we simply leave them in place (he won't act anyway).
 */

import type { GameState, HeroRuntime, MonsterInstance, Wound } from './gameState.js';
import type { TargetKind, WoundSource } from './events.js';
import { emit } from './logger.js';
import { discard } from './piles.js';
import { onDamageResolved, shouldCancelDamage } from './modifiers.js';
import {
  hookBossDamageAllowed,
  hookInvuncheDrawDestinOnDamage,
  hookInvuncheDamageMarksCapaciteUsed,
  hookKaggenElimDrawsChasse,
} from './bossPassifs.js';
import {
  fireReactiveObjectTriggers,
  fireReactiveForAllies,
} from './reactiveObjects.js';
import { runOps, mkCtx } from './effects.js';

function nextWoundId(state: GameState): string {
  state.counters.wound += 1;
  return `W${state.counters.wound}`;
}

function totalWounds(wounds: readonly Wound[]): number {
  let s = 0;
  for (const w of wounds) s += w.degats;
  return s;
}

export function totalWoundsOfHero(h: HeroRuntime): number {
  return totalWounds(h.wounds);
}

export function totalWoundsOfBoss(state: GameState): number {
  return totalWounds(state.boss.wounds);
}

export function totalWoundsOfMonster(m: MonsterInstance): number {
  return totalWounds(m.wounds);
}

// ---------------------------------------------------------------------------
// Damage application
// ---------------------------------------------------------------------------

export interface DamageSpec {
  amount: number;
  source: WoundSource;
  sourceCardId: string;
}

/** Inflict damage on a hero. Returns true if the hero died as a result. */
export async function damageHero(state: GameState, seat: number, spec: DamageSpec): Promise<boolean> {
  const h = state.heroes[seat];
  if (!h) throw new Error(`No hero at seat ${seat}`);
  if (h.dead) return false;

  // Check damage-cancelling modifiers (e.g. Nawel capacité).
  const cancel = shouldCancelDamage(state, seat);
  if (cancel.cancel) {
    emit(state, {
      kind: 'WARN',
      message: `damage_cancelled seat=${seat} source=${spec.sourceCardId} via=${cancel.via?.sourceCardId}`,
    });
    onDamageResolved(state, seat); // still consume nextDamageToSelf scopes
    return false;
  }

  const woundId = nextWoundId(state);
  const wound: Wound = {
    woundId,
    source: spec.source,
    sourceCardId: spec.sourceCardId,
    degats: spec.amount,
  };
  h.wounds.push(wound);
  emit(state, {
    kind: 'DAMAGE',
    sourceCardId: spec.sourceCardId,
    source: spec.source,
    targetKind: 'hero',
    targetId: h.heroId,
    amount: spec.amount,
    woundId,
  });
  onDamageResolved(state, seat);
  // Invunche passif variants.
  if (spec.source === 'menace' || spec.source === 'boss') {
    await hookInvuncheDrawDestinOnDamage(state, seat);
    hookInvuncheDamageMarksCapaciteUsed(state, seat);
  }
  // Reactive posed objects: post-damage triggers fire here.
  await fireReactiveObjectTriggers(state, 'on_self_damage', seat);
  await fireReactiveForAllies(state, 'on_ally_damage', seat);
  // Lethal threshold → fire on_self_lethal_damage; reactions may heal so
  // re-check before killing.
  if (totalWoundsOfHero(h) >= h.vieMax) {
    await fireReactiveObjectTriggers(state, 'on_self_lethal_damage', seat);
  }
  if (totalWoundsOfHero(h) >= h.vieMax) {
    return await killHero(state, seat);
  }
  return false;
}

/** Inflict damage on the boss. Returns true if the boss is now defeated. */
export async function damageBoss(state: GameState, spec: DamageSpec): Promise<boolean> {
  if (state.boss.defeated) return false;
  if (!hookBossDamageAllowed(state)) return false;
  const woundId = nextWoundId(state);
  const wound: Wound = {
    woundId,
    source: spec.source,
    sourceCardId: spec.sourceCardId,
    degats: spec.amount,
  };
  state.boss.wounds.push(wound);
  emit(state, {
    kind: 'DAMAGE',
    sourceCardId: spec.sourceCardId,
    source: spec.source,
    targetKind: 'boss' as TargetKind,
    targetId: state.boss.bossId,
    amount: spec.amount,
    woundId,
  });
  // Akkoro passif bookkeeping: active hero damaged the boss this turn.
  if (spec.source === 'chasse') state.activeDamagedBossThisTurn = true;
  if (totalWoundsOfBoss(state) >= state.boss.vieMax) {
    state.boss.defeated = true;
    emit(state, { kind: 'BOSS_DEFEATED', bossId: state.boss.bossId });
    state.result = 'victory';
    state.phase = 'GAME_END';
    return true;
  }
  return false;
}

/**
 * Inflict damage on a monster instance. Returns true if eliminated.
 * `seat` is the seat whose queue currently holds the monster.
 */
export async function damageMonster(
  state: GameState,
  seat: number,
  instanceId: string,
  spec: DamageSpec,
): Promise<boolean> {
  const h = state.heroes[seat];
  if (!h) throw new Error(`No hero at seat ${seat}`);
  const idx = h.queue.findIndex((m) => m.instanceId === instanceId);
  if (idx < 0) throw new Error(`Monster ${instanceId} not in queue of seat ${seat}`);
  const monster = h.queue[idx]!;
  const woundId = nextWoundId(state);
  monster.wounds.push({
    woundId,
    source: spec.source,
    sourceCardId: spec.sourceCardId,
    degats: spec.amount,
  });
  emit(state, {
    kind: 'DAMAGE',
    sourceCardId: spec.sourceCardId,
    source: spec.source,
    targetKind: 'monster',
    targetId: instanceId,
    amount: spec.amount,
    woundId,
  });
  const m = state.catalog?.monstreById.get(monster.cardId);
  const vie = m?.vie ?? 1;
  // Ombre-style passif: immune tant que pas en tête de file.
  if (monster.cardId === 'MON_010' && h.queue[0]?.instanceId !== monster.instanceId) {
    // Retire immediately the wound we just added — monster ignores damage.
    monster.wounds.pop();
    emit(state, { kind: 'WARN', message: `MON_010 Ombre ignores damage (not queue head)` });
    return false;
  }
  if (totalWoundsOfMonster(monster) >= vie) {
    // Track "action kill" per turn for potential future reactive triggers.
    if (spec.source === 'chasse') {
      const active = state.heroes[state.activeSeat];
      if (active) active.actionKillsThisTurn = (active.actionKillsThisTurn ?? 0) + 1;
    }
    await eliminateMonster(state, seat, instanceId);
    return true;
  }
  return false;
}

/** Remove a monster from a queue and send the card to the discard. */
export async function eliminateMonster(state: GameState, seat: number, instanceId: string): Promise<void> {
  const h = state.heroes[seat];
  if (!h) throw new Error(`No hero at seat ${seat}`);
  const idx = h.queue.findIndex((m) => m.instanceId === instanceId);
  if (idx < 0) return;
  const [removed] = h.queue.splice(idx, 1);
  if (!removed) return;
  const card = state.catalog?.monstreById.get(removed.cardId);
  if (card) discard(state.piles.monstre, card);
  emit(state, {
    kind: 'ELIMINATE_MONSTER',
    instanceId: removed.instanceId,
    cardId: removed.cardId,
    seat,
  });
  // onEliminate trigger — synchronous to preserve ordering.
  const trig = state.effects[removed.cardId]?.triggers?.onEliminate;
  if (trig && trig.length > 0) {
    await runOps(state, mkCtx(seat, removed.cardId, 'monstre'), trig);
  }
  // Kaggen passif: the hero who eliminated the monster draws 1 Chasse.
  hookKaggenElimDrawsChasse(state, seat);
  // Reactive posed objects for the eliminator.
  await fireReactiveObjectTriggers(state, 'on_self_eliminates_monster', seat);
  if (h.queue.length === 0) {
    await fireReactiveObjectTriggers(state, 'on_self_clears_own_queue', seat);
  }
}

// ---------------------------------------------------------------------------
// Hero death
// ---------------------------------------------------------------------------

/** Find the next living hero clockwise starting AFTER `fromSeat`. */
function findNextLivingHero(state: GameState, fromSeat: number): HeroRuntime | undefined {
  for (let offset = 1; offset <= state.nPlayers; offset++) {
    const idx = (fromSeat + offset) % state.nPlayers;
    const h = state.heroes[idx];
    if (h && !h.dead) return h;
  }
  return undefined;
}

/** Mark a hero as dead, cascade queue to next living hero, check defeat. */
async function killHero(state: GameState, seat: number): Promise<true> {
  const h = state.heroes[seat]!;

  // Death-triggered objects (tag `death_burst`, e.g. GUE_O06 Dernier rempart)
  // fire one last time before the hero is marked dead.
  for (let i = h.objects.length - 1; i >= 0; i--) {
    const obj = h.objects[i]!;
    const entry = state.effects[obj.id];
    if (entry?.tag !== 'death_burst' || !entry.ops || entry.ops.length === 0) continue;
    h.objects.splice(i, 1);
    emit(state, { kind: 'OBJECT_USED', seat, card: obj.id, reason: `dernier souffle avant mort` });
    await runOps(state, mkCtx(seat, obj.id, 'chasse'), entry.ops);
    discard(state.piles.chasse, obj);
    emit(state, { kind: 'DISCARD_CARD', pile: 'chasse', card: obj.id, fromSeat: seat });
  }

  h.dead = true;
  emit(state, { kind: 'HERO_DEATH', seat });
  // Reactive trigger for allies' posed objects (MAG_O01 Cendres du Danakil).
  await fireReactiveForAllies(state, 'on_ally_dies', seat);

  // Redistribute monsters of his queue to next living hero.
  if (h.queue.length > 0) {
    const heir = findNextLivingHero(state, seat);
    if (heir) {
      heir.queue.push(...h.queue);
    }
    // If no heir, they vanish — but that means all heroes are dead, which
    // is handled by the defeat check below anyway.
    h.queue = [];
  }

  // Defeat if everyone is down.
  if (state.heroes.every((hh) => hh.dead)) {
    state.result = 'defeat';
    state.phase = 'GAME_END';
  }
  return true;
}

