/**
 * Effect DSL types.
 *
 * An `EffectOp[]` describes what a card does when played. Executed sequentially
 * by the interpreter (see `effects.ts`). Stored in `simulator/data/effects.json`
 * keyed by card id — **never** in the Unity design JSONs.
 *
 * J3 scope (10 operations):
 *   attack, damage, heal, draw, drawDestin, summon, eliminate, moveMonster,
 *   regenCapacite, discard, require
 *
 * Not yet in J3: choice (événements Menace), modifier (passifs persistants),
 * forEach (iteration explicite), revive.
 *
 * Selectors use small string tokens for common cases, or objects for picks
 * that require a player/RNG choice.
 */

// ---------------------------------------------------------------------------
// Target selectors
// ---------------------------------------------------------------------------

export type HeroTargetTok =
  | 'self'         // héros actif (jeu / source de l'effet)
  | 'active'       // synonyme de self
  | 'any_hero'     // choix parmi tous les héros vivants (incl. self)
  | 'any_ally'     // choix parmi tous les alliés vivants (exclut self)
  | 'each_hero'    // itération : tous les héros vivants
  | 'each_ally'    // itération : tous les alliés vivants
  | 'next_hero';   // prochain héros vivant (horaire)

export type DamageTargetTok =
  | 'queue_head'   // tête de file du héros actif (cible par défaut)
  | 'boss'         // colosse (ignore la contrainte "vider sa file d'abord")
  | 'active_hero'  // le héros actif lui-même (self-damage)
  | 'any_hero_not_self'; // dégât à un autre héros (SOI_A10 Sacrifice)

export interface MonsterPick {
  pick:
    | 'monster_in_self_queue'
    | 'monster_in_any_queue'
    | 'queue_head_self';
  /** Optional filter predicate tokens (J3 has only these). */
  where?: 'has_damage' | 'at_most_life_N' | 'vie_eq_1';
  /** Param when where = at_most_life_N. */
  N?: number;
}

export interface QueueDest {
  to:
    | 'self_queue_tail'
    | 'next_hero_queue_tail'
    | 'ally_queue_tail' // choix d'un allié
    | 'self_queue_head';
}

// ---------------------------------------------------------------------------
// Conditions (used by `require`)
// ---------------------------------------------------------------------------

export type Comparator =
  | { op: '>='; value: number }
  | { op: '<='; value: number }
  | { op: '=='; value: number }
  | { op: '>'; value: number }
  | { op: '<'; value: number };

export type Condition =
  | { self_damage: Comparator }
  | { hand_size: Comparator }
  | { no_ally_has_damage: true }
  | { and: Condition[] }
  | { or: Condition[] }
  | { not: Condition };

// ---------------------------------------------------------------------------
// Operation variants
// ---------------------------------------------------------------------------

/**
 * `attack` — play the attack using the card's base `degats`, with optional
 * targeting override. If omitted, default targeting applies (queue head, else
 * boss). `amount` overrides the card's degats for attacks where only the
 * effect is counted as damage.
 */
export interface OpAttack {
  op: 'attack';
  target?: DamageTargetTok | MonsterPick;
  amount?: number;
}

export interface OpDamage {
  op: 'damage';
  target: DamageTargetTok | MonsterPick;
  amount: number;
}

export interface OpHeal {
  op: 'heal';
  target: HeroTargetTok;
  amount: number;
}

export interface OpDraw {
  op: 'draw';
  target: HeroTargetTok;
  n: number;
}

export interface OpDrawDestin {
  op: 'drawDestin';
  target: HeroTargetTok;
  n?: number; // default 1
}

export interface OpSummon {
  op: 'summon';
  target: HeroTargetTok; // whose queue
  n?: number; // default 1
}

export interface OpEliminate {
  op: 'eliminate';
  target: MonsterPick;
}

export interface OpMoveMonster {
  op: 'moveMonster';
  from: MonsterPick;
  to: QueueDest;
}

export interface OpRegenCapacite {
  op: 'regenCapacite';
  target: HeroTargetTok;
}

export interface OpDiscard {
  op: 'discard';
  target: HeroTargetTok;
  n: number;
  random?: boolean; // if true, pick at random; else AI chooses
}

/** Guard: if cond is false, abort the entire effect chain (card fizzles). */
export interface OpRequire {
  op: 'require';
  cond: Condition;
}

export type EffectOp =
  | OpAttack
  | OpDamage
  | OpHeal
  | OpDraw
  | OpDrawDestin
  | OpSummon
  | OpEliminate
  | OpMoveMonster
  | OpRegenCapacite
  | OpDiscard
  | OpRequire;

/** One entry per card id in effects.json. */
export interface CardEffectEntry {
  /** Human-readable comment mirroring the card text, for debugging. */
  effet?: string;
  /** Sequence of operations to execute when the card resolves. */
  ops: EffectOp[];
  /** AI decision tag (§12 of the plan). Used later by heuristic policies. */
  tag?: string;
}

/** Top-level file shape for simulator/data/effects.json. */
export type EffectsCatalog = Record<string, CardEffectEntry>;
