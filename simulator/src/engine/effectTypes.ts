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

/**
 * Move the triggering monster instance to the head of its own queue
 * (used by MON_018 Bond onArrive). Only meaningful inside monster triggers
 * where `ctx.sourceCardId` corresponds to a monster freshly placed.
 */
export interface OpMoveSelfMonsterToHead {
  op: 'moveSelfMonsterToHead';
}

/**
 * Give the control back to the active hero's policy for N extra actions.
 * Used by Isonash (play 2 more actions) and similar meta-abilities. The
 * policy picks a PlayerAction each time; the engine executes it as a
 * regular applyPlayerAction call.
 */
export interface OpPlayMoreActions {
  op: 'playMoreActions';
  n: number;
  /** Restrict the follow-up action kind. Default allows any. */
  restrictTo?: 'play_action_only';
}

/** Open a free exchange window across all heroes (Aslan capacité). */
export interface OpOpenFreeExchange {
  op: 'openFreeExchange';
  /** Max total swaps to perform (policy-driven). */
  maxSwaps?: number;
}

/** Trigger the boss's actif (⚡ capacité) outside of its normal sequence slot. */
export interface OpBossActif {
  op: 'bossActif';
}

/** Resolve N attack orders on a hero's queue (self = active hero, each_hero = all). */
export interface OpAttackOrder {
  op: 'attackOrder';
  target: 'self' | 'each_hero';
}

/** One-shot: next Action played by self ignores its prerequis (MAG_O02). */
export interface OpIgnorePrereqNext {
  op: 'ignorePrereqNext';
}

/** Draw N cards where N = total wounds on self (GUE_O03). */
export interface OpDrawPerSelfWound {
  op: 'drawPerSelfWound';
}

/** Move all monsters of every *other* living hero's queue to self's tail (DIP_A12). */
export interface OpRallyToSelf {
  op: 'rallyToSelf';
}

/** Each living ally transfers 1 Chasse card of their hand to self (DIP_O01). */
export interface OpGiveCardsFromAllies {
  op: 'giveCardsFromAllies';
}

/** Self transfers 1 Chasse card from hand to each living ally (DIP_O02). */
export interface OpGiveCardsToAllies {
  op: 'giveCardsToAllies';
}

/** Grant self one extra Objet pose slot this turn (ROD_A04). */
export interface OpGrantExtraPose {
  op: 'grantExtraPose';
}

/** Swap 1 Action card with a chosen ally — mutually beneficial picks (DIP_A02). */
export interface OpSwapHandWithAlly {
  op: 'swapHandWithAlly';
}

/** Swap all posed Objets with a chosen ally (DIP_A04, DIP_A08). */
export interface OpSwapObjectsWithAlly {
  op: 'swapObjectsWithAlly';
}

/** Gift up to N cards from hand to an ally; heal self by number transferred (DIP_A09). */
export interface OpGiftCardsToAlly {
  op: 'giftCardsToAlly';
  n: number;
  healPerCard?: number;
}

/** Scry N from Chasse pile, keep K on top, discard rest (ROD_A07). */
export interface OpScryChasse {
  op: 'scryChasse';
  look: number;
  keep: number;
}

/** Attack queue head; if killed, cascade same damage to new head (ROD_O02). */
export interface OpAttackChain {
  op: 'attackChain';
  amount: number;
}

/** Heal self = number of actions played this turn (ROD_O03). */
export interface OpHealEqualsActionsThisTurn {
  op: 'healEqualsActionsThisTurn';
}

/** Heal self = number of cards drawn this turn (ROD_O06). */
export interface OpHealEqualsDrawsThisTurn {
  op: 'healEqualsDrawsThisTurn';
}

/** Eliminate a monster only if hero played ≥ N Actions this turn (ROD_O04). */
export interface OpEliminateIfActionsThisTurn {
  op: 'eliminateIfActionsThisTurn';
  minActions: number;
  from: 'monster_in_self_queue' | 'monster_in_any_queue';
}

/** Move 1 wound from any ally to queue head (SOI_A03). */
export interface OpDrawFromDiscard {
  op: 'drawFromDiscard';
  target: 'self' | 'any_ally';
  n: number;
}

/** Redistribute wounds across living heroes toward the mean (SOI_A11). */
export interface OpRedistributeWounds {
  op: 'redistributeWounds';
}

/** Discard one posed Objet on target (BOSS_005 actif). */
export interface OpDiscardObject {
  op: 'discardObject';
  target: 'active_hero' | 'self';
  n: number;
}

/** Force active hero to only be able to draw this turn (BOSS_007 actif). */
export interface OpRestrictToDraw {
  op: 'restrictToDraw';
  target: 'active_hero';
}

/** Active hero discards full hand and draws the same count (BOSS_008 actif). */
export interface OpDiscardHandDrawSame {
  op: 'discardHandDrawSame';
  target: 'active_hero';
}

/** Scout solo (DEN_018): discard 2 Actions → draw 2, else take 1 damage. */
export interface OpScoutSolo {
  op: 'scoutSolo';
}

/** Take up to `max` queue heads from other living heroes, push to source's tail (GUE_A07). */
export interface OpRallyHeadsToSelf {
  op: 'rallyHeadsToSelf';
  max: number;
}

/** Draw until hand has at least `n` cards (ROD_O05). */
export interface OpDrawUpTo {
  op: 'drawUpTo';
  target: 'self';
  n: number;
}

/** Eliminate the queue head of a chosen living ally (DIP_A07). */
export interface OpEliminateAllyHead {
  op: 'eliminateAllyHead';
}

/** A chosen queue head's monster deals its vie in damage to boss (DIP_A10). */
export interface OpReassignHeadToBoss {
  op: 'reassignHeadToBoss';
}

/** Heal an ally by amount = self's total wounds (SOI_O03). */
export interface OpHealAllyEqualsSelfWounds {
  op: 'healAllyEqualsSelfWounds';
}

/** Draw 1; if it was an Objet, draw 1 extra (DEN_006). */
export interface OpDrawWithObjetBonus {
  op: 'drawWithObjetBonus';
  target: 'self';
}

/** Run one more action via active hero's ally policy (DIP_A05). */
export interface OpAllyPlaysAction {
  op: 'allyPlaysAction';
}

/** Deal `amount` damage to queue head only if a hero was healed this turn (SOI_O05). */
export interface OpDamageIfHealed {
  op: 'damageIfHealed';
  amount: number;
}

/** Set the one-shot chain-on-kill flag for the current attack (ROD_O02 renfort). */
export interface OpSetChainOnKill {
  op: 'setChainOnKill';
}

/** Snapshot each queue head then move all to the next hero's tail simultaneously (legacy). */
export interface OpRotateHeadsToNext {
  op: 'rotateHeadsToNext';
}

/** Cancel the in-flight Destin resolution (SOI_O03 Gemme de communion). */
export interface OpCancelDestin {
  op: 'cancelDestin';
}

/** Remove the most recently added wound from self (SOI_O02 Totem de transe). */
export interface OpRemoveLastWound {
  op: 'removeLastWound';
  target: 'self';
}

/** Summon 1 monster in every hero queue that is currently empty (BOSS_003 actif). */
export interface OpSummonOnEmptyQueues {
  op: 'summonOnEmptyQueues';
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
  | OpCancelMenace
  | OpMoveSelfMonsterToHead
  | OpPlayMoreActions
  | OpOpenFreeExchange
  | OpBossActif
  | OpAttackOrder
  | OpIgnorePrereqNext
  | OpDrawPerSelfWound
  | OpRallyToSelf
  | OpGiveCardsFromAllies
  | OpGiveCardsToAllies
  | OpGrantExtraPose
  | OpSwapHandWithAlly
  | OpSwapObjectsWithAlly
  | OpGiftCardsToAlly
  | OpScryChasse
  | OpAttackChain
  | OpHealEqualsActionsThisTurn
  | OpHealEqualsDrawsThisTurn
  | OpEliminateIfActionsThisTurn
  | OpDrawFromDiscard
  | OpRedistributeWounds
  | OpDiscardObject
  | OpRestrictToDraw
  | OpDiscardHandDrawSame
  | OpScoutSolo
  | OpRallyHeadsToSelf
  | OpDrawUpTo
  | OpEliminateAllyHead
  | OpReassignHeadToBoss
  | OpHealAllyEqualsSelfWounds
  | OpDrawWithObjetBonus
  | OpAllyPlaysAction
  | OpDamageIfHealed
  | OpSetChainOnKill
  | OpRotateHeadsToNext
  | OpSummonOnEmptyQueues
  | OpCancelDestin
  | OpRemoveLastWound;

/**
 * Reactive triggers for posed Objet cards. When the matching game event is
 * emitted in the engine, the first posed object owned by the relevant hero
 * whose `reactive.trigger` matches fires its ops and is discarded.
 */
export type ReactiveTrigger =
  | 'on_self_damage'
  | 'on_ally_damage'
  | 'on_self_lethal_damage'
  | 'on_self_eliminates_monster'
  | 'on_self_capacite_used'
  | 'on_ally_capacite_used'
  | 'on_destin_drawn_any'
  | 'on_menace_revealed'
  | 'on_monster_attacks_self'
  | 'on_third_monster_arrives_self'
  | 'on_self_played_2_actions'
  | 'on_self_low_hand'
  | 'on_self_high_hand_draw'
  | 'on_self_exchange'
  | 'on_self_heals_ally';

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

  /** Reactive object trigger — fires once on matching engine event, then the
   *  object is discarded. Only meaningful on posed Objet cards. */
  reactive?: {
    trigger: ReactiveTrigger;
    ops: EffectOp[];
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
    | 'attack_order_all_queues'
    | 'max_draws_per_turn_1'
    | 'hand_cap_6_end_of_turn'
    | 'hand_cap_5_end_of_turn'
    | 'damage_unhealable_from_menace'
    | 'reshuffle_heals_boss_2'
    | 'active_discards_top_chasse_on_action'
    | 'akkoro_damage_discards_chasse'
    | 'invunche_draw_destin_on_damage'
    | 'invunche_damage_marks_capacite_used'
    | 'heal_cap_1'
    | 'boss_receives_max_1_damage_per_turn'
    | 'boss_before_heroes'
    | 'kaggen_elim_draws_chasse'
  >;
}

/** Top-level file shape for simulator/data/effects.json. */
export type EffectsCatalog = Record<string, CardEffectEntry>;
