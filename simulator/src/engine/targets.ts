/**
 * Target and condition resolution for the effect DSL.
 *
 * Resolution depends on:
 *  - the current `GameState`
 *  - the `sourceSeat` (the hero whose action is resolving; the "self" of ops)
 *  - an `Rng` for tie-breaking on `any_*` picks (policies can override later)
 *
 * All picks use the engine RNG so replays are deterministic.
 */

import type { GameState, HeroRuntime } from './gameState.js';
import type {
  Condition,
  DamageTargetTok,
  HeroTargetTok,
  MonsterPick,
  QueueDest,
} from './effectTypes.js';
import { Rng } from './rng.js';

function withRng<T>(state: GameState, fn: (rng: Rng) => T): T {
  const rng = Rng.fromState(state.rngState);
  const result = fn(rng);
  state.rngState = rng.state;
  return result;
}

function totalWounds(wounds: { degats: number }[]): number {
  let s = 0;
  for (const w of wounds) s += w.degats;
  return s;
}

function livingHeroes(state: GameState): HeroRuntime[] {
  return state.heroes.filter((h) => !h.dead);
}

// ---------------------------------------------------------------------------
// Hero target resolution
// ---------------------------------------------------------------------------

/** Returns zero, one, or many seats depending on token semantics. */
export function resolveHeroTarget(
  state: GameState,
  sourceSeat: number,
  tok: HeroTargetTok,
): number[] {
  switch (tok) {
    case 'self':
    case 'active': {
      const h = state.heroes[sourceSeat];
      return h && !h.dead ? [sourceSeat] : [];
    }
    case 'any_hero': {
      const candidates = livingHeroes(state).map((h) => h.seatIdx);
      if (candidates.length === 0) return [];
      const pick = withRng(state, (rng) => rng.pick(candidates));
      return [pick];
    }
    case 'any_ally': {
      const candidates = livingHeroes(state)
        .map((h) => h.seatIdx)
        .filter((s) => s !== sourceSeat);
      if (candidates.length === 0) return [];
      const pick = withRng(state, (rng) => rng.pick(candidates));
      return [pick];
    }
    case 'each_hero':
      return livingHeroes(state).map((h) => h.seatIdx);
    case 'each_ally':
      return livingHeroes(state)
        .map((h) => h.seatIdx)
        .filter((s) => s !== sourceSeat);
    case 'next_hero': {
      for (let offset = 1; offset <= state.nPlayers; offset++) {
        const idx = (sourceSeat + offset) % state.nPlayers;
        const h = state.heroes[idx];
        if (h && !h.dead) return [idx];
      }
      return [];
    }
    default: {
      const _exhaust: never = tok;
      return _exhaust;
    }
  }
}

// ---------------------------------------------------------------------------
// Monster pick resolution
// ---------------------------------------------------------------------------

export interface MonsterRef {
  seat: number;
  instanceId: string;
  cardId: string;
}

export function resolveMonsterPick(
  state: GameState,
  sourceSeat: number,
  spec: MonsterPick,
): MonsterRef | undefined {
  const source = state.heroes[sourceSeat];
  if (!source) return undefined;

  // Build the raw candidate list.
  let candidates: MonsterRef[] = [];
  switch (spec.pick) {
    case 'monster_in_self_queue':
      candidates = source.queue.map((m) => ({
        seat: sourceSeat,
        instanceId: m.instanceId,
        cardId: m.cardId,
      }));
      break;
    case 'monster_in_any_queue':
      for (const h of state.heroes) {
        for (const m of h.queue) {
          candidates.push({ seat: h.seatIdx, instanceId: m.instanceId, cardId: m.cardId });
        }
      }
      break;
    case 'queue_head_self': {
      const head = source.queue[0];
      if (head) {
        candidates.push({ seat: sourceSeat, instanceId: head.instanceId, cardId: head.cardId });
      }
      break;
    }
  }

  // Apply filter.
  if (spec.where) {
    candidates = candidates.filter((c) => {
      const h = state.heroes[c.seat];
      if (!h) return false;
      const m = h.queue.find((mm) => mm.instanceId === c.instanceId);
      if (!m) return false;
      const card = state.catalog.monstreById.get(m.cardId);
      const vie = card?.vie ?? 1;
      const wounded = totalWounds(m.wounds);
      const remaining = vie - wounded;
      if (spec.where === 'has_damage') return wounded > 0;
      if (spec.where === 'vie_eq_1') return remaining === 1;
      if (spec.where === 'at_most_life_N') return remaining <= (spec.N ?? 1);
      return false;
    });
  }

  if (candidates.length === 0) return undefined;
  return withRng(state, (rng) => rng.pick(candidates));
}

// ---------------------------------------------------------------------------
// Queue destination resolution (where to place a moved monster)
// ---------------------------------------------------------------------------

export function resolveQueueDest(
  state: GameState,
  sourceSeat: number,
  dest: QueueDest,
): { seat: number; position: 'head' | 'tail' } | undefined {
  const source = state.heroes[sourceSeat];
  if (!source) return undefined;
  switch (dest.to) {
    case 'self_queue_tail':
      return { seat: sourceSeat, position: 'tail' };
    case 'self_queue_head':
      return { seat: sourceSeat, position: 'head' };
    case 'next_hero_queue_tail': {
      for (let offset = 1; offset <= state.nPlayers; offset++) {
        const idx = (sourceSeat + offset) % state.nPlayers;
        const h = state.heroes[idx];
        if (h && !h.dead) return { seat: idx, position: 'tail' };
      }
      return undefined;
    }
    case 'ally_queue_tail': {
      const allies = state.heroes
        .filter((h) => !h.dead && h.seatIdx !== sourceSeat)
        .map((h) => h.seatIdx);
      if (allies.length === 0) return undefined;
      const pick = withRng(state, (rng) => rng.pick(allies));
      return { seat: pick, position: 'tail' };
    }
  }
}

// ---------------------------------------------------------------------------
// Damage target resolution (for damage/attack ops)
// ---------------------------------------------------------------------------

export type ResolvedDmgTarget =
  | { kind: 'hero'; seat: number }
  | { kind: 'boss' }
  | { kind: 'monster'; seat: number; instanceId: string };

export function resolveDamageTarget(
  state: GameState,
  sourceSeat: number,
  tok: DamageTargetTok | MonsterPick,
): ResolvedDmgTarget | undefined {
  if (typeof tok !== 'string') {
    const m = resolveMonsterPick(state, sourceSeat, tok);
    if (!m) return { kind: 'boss' };
    return { kind: 'monster', seat: m.seat, instanceId: m.instanceId };
  }
  switch (tok) {
    case 'queue_head': {
      const source = state.heroes[sourceSeat];
      const head = source?.queue[0];
      if (head) return { kind: 'monster', seat: sourceSeat, instanceId: head.instanceId };
      return { kind: 'boss' };
    }
    case 'boss':
      return { kind: 'boss' };
    case 'active_hero':
      return { kind: 'hero', seat: sourceSeat };
    case 'any_hero_not_self': {
      const candidates = livingHeroes(state)
        .map((h) => h.seatIdx)
        .filter((s) => s !== sourceSeat);
      if (candidates.length === 0) return undefined;
      const pick = withRng(state, (rng) => rng.pick(candidates));
      return { kind: 'hero', seat: pick };
    }
  }
}

// ---------------------------------------------------------------------------
// Condition evaluation (for `require`)
// ---------------------------------------------------------------------------

function compare(left: number, cmp: { op: string; value: number }): boolean {
  switch (cmp.op) {
    case '>=':
      return left >= cmp.value;
    case '<=':
      return left <= cmp.value;
    case '==':
      return left === cmp.value;
    case '>':
      return left > cmp.value;
    case '<':
      return left < cmp.value;
    default:
      return false;
  }
}

export function evalCondition(
  state: GameState,
  sourceSeat: number,
  cond: Condition,
): boolean {
  if ('and' in cond) return cond.and.every((c) => evalCondition(state, sourceSeat, c));
  if ('or' in cond) return cond.or.some((c) => evalCondition(state, sourceSeat, c));
  if ('not' in cond) return !evalCondition(state, sourceSeat, cond.not);
  if ('self_damage' in cond) {
    const h = state.heroes[sourceSeat];
    if (!h) return false;
    return compare(totalWounds(h.wounds), cond.self_damage);
  }
  if ('hand_size' in cond) {
    const h = state.heroes[sourceSeat];
    if (!h) return false;
    return compare(h.hand.length, cond.hand_size);
  }
  if ('no_ally_has_damage' in cond) {
    // True iff no ally (excluding self) has any damage.
    return state.heroes
      .filter((h) => !h.dead && h.seatIdx !== sourceSeat)
      .every((h) => totalWounds(h.wounds) === 0);
  }
  return false;
}
