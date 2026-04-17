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

/** Eliminate ALL monsters matching a selector (e.g. Daraa "tous les blessés"). */
export interface OpEliminateWhere {
  op: 'eliminateWhere';
  from: 'monster_in_self_queue' | 'monster_in_any_queue';
  where?: 'has_damage' | 'at_most_life_N' | 'vie_eq_1';
  N?: number;
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

/**
 * Iterate over a list of heroes, running `do` with each as the current `self`.
 * Note: for monster iteration, use `eliminateWhere` (bulk) or individual ops.
 */
export interface OpForEach {
  op: 'forEach';
  over: 'each_hero' | 'each_ally';
  do: EffectOp[];
}

/**
 * Offer N options to a policy; chosen option's ops are executed. Other
 * branches discarded.
 */
export interface OpChoice {
  op: 'choice';
  /** Who decides: defaults to 'active'. `any_hero` picks randomly among
   *  living heroes. */
  who?: 'active' | 'any_hero';
  options: Array<{ label: string; ops: EffectOp[] }>;
}

/**
 * Apply a persistent modifier with a scope. Scopes auto-clean at boundary.
 *
 * J3.5 scopes:
 *   - 'thisTurn'         : cleared at END_TURN
 *   - 'nextDamageToSelf' : cleared after the first damage event on `targetSeat`
 *   - 'nextAttackByActive' : cleared after the first attack by `targetSeat`
 *
 * J3.5 effects:
 *   - { no_damage_to: seat }     : cancels damage events whose target is `seat`
 *   - { heal_cap: number }       : caps heal amount for all heals applied after
 *   - { bonus_damage_next: number } : adds to the next attack by the target seat
 */
/** Direct damage to the boss (bypasses file targeting). */
export interface OpBossDamage {
  op: 'bossDamage';
  amount: number;
}

/** Direct heal of the boss (cards like Offrande de peur). */
export interface OpBossHeal {
  op: 'bossHeal';
  amount: number;
}

/** Move N wound cards from one hero to another (or self→boss, self→monster). */
export interface OpShiftDamage {
  op: 'shiftDamage';
  from: 'self' | 'any_hero' | 'any_ally';
  to: 'self' | 'any_hero' | 'any_ally' | 'queue_head' | 'boss' | MonsterPick;
  amount: number;
}

/** Remove all wounds from a hero (Gao capacity, real version). */
export interface OpRemoveAllWounds {
  op: 'removeAllWounds';
  target: HeroTargetTok;
}

/** Revive a dead hero at N wounds remaining (SOI_A06). */
export interface OpRevive {
  op: 'revive';
  target: 'any_dead_hero';
  /** Heal amount applied immediately after revival. Default 0. */
  heal?: number;
}

/** Cancel the Menace currently being resolved (GUE_O05, DIP_O05). */
export interface OpCancelMenace {
  op: 'cancelMenace';
}

export interface OpModifier {
  op: 'modifier';
  effect: ModifierEffect;
  scope: ModifierScope;
  /** Seat that the modifier attaches to (defaults to 'active'). */
  target?: 'self';
}

export type ModifierScope =
  | 'thisTurn'
  | 'nextDamageToSelf'
  | 'nextAttackByActive';

export type ModifierEffect =
  | { kind: 'no_damage'; seat: number }
  | { kind: 'heal_cap'; max: number }
  | { kind: 'bonus_damage_next'; seat: number; amount: number };

export type EffectOp =
  | OpAttack
  | OpDamage
  | OpHeal
  | OpDraw
  | OpDrawDestin
  | OpSummon
  | OpEliminate
  | OpEliminateWhere
  | OpMoveMonster
  | OpRegenCapacite
  | OpDiscard
  | OpRequire
  | OpForEach
  | OpChoice
  | OpModifier
  | OpBossDamage
  | OpBossHeal
  | OpShiftDamage
  | OpRemoveAllWounds
  | OpRevive
  | OpCancelMenace;

/** One entry per card id in effects.json. */
export interface CardEffectEntry {
  /** Human-readable comment mirroring the card text, for debugging. */
  effet?: string;
  /** Sequence of operations to execute when the card resolves. */
  ops: EffectOp[];
  /** AI decision tag (§12 of the plan). Used later by heuristic policies. */
  tag?: string;

  /** Monster triggers — only meaningful on MON_xxx entries. */
  triggers?: {
    onArrive?: EffectOp[];
    onAttack?: EffectOp[];
    onDamage?: EffectOp[];
    onEliminate?: EffectOp[];
  };

  /** Boss — only meaningful on BOSS_xxx entries. */
  actif_ops?: EffectOp[];
  /** Boss passifs described as modifier recipes applied once at setup. */
  passif_modifiers?: Array<{
    effect: ModifierEffect;
    scope: ModifierScope;
  }>;
  /**
   * Non-modifier passifs that hook at specific runtime points (see boss
   * passive dispatch). Stored as a list of predicate names; handlers in
   * `engine/bossPassifs.ts` translate them to concrete behaviour.
   */
  passif_hooks?: Array<
    | 'attack_order_next_queue_too'
    | 'max_draws_per_turn_1'
    | 'hand_cap_6_end_of_turn'
    | 'damage_unhealable_from_menace'
    | 'reshuffle_heals_boss_2'
    | 'active_discards_top_chasse_on_action'
    | 'invunche_draw_destin_on_damage'
    | 'heal_cap_1'
    | 'boss_receives_max_1_damage_per_turn'
  >;
}

/** Top-level file shape for simulator/data/effects.json. */
export type EffectsCatalog = Record<string, CardEffectEntry>;
