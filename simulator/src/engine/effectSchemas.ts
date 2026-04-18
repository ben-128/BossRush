/**
 * Zod validation for simulator/data/effects.json.
 *
 * Separate from design schemas because this file is owned by the simulator,
 * not by Unity. Validation catches typos in op names, missing targets, etc.
 */

import { z } from 'zod';

const Comparator = z.object({
  op: z.enum(['>=', '<=', '==', '>', '<']),
  value: z.number(),
});

const BaseCondition = z.union([
  z.object({ self_damage: Comparator }),
  z.object({ hand_size: Comparator }),
  z.object({ no_ally_has_damage: z.literal(true) }),
]);

// Recursive for and/or/not — use z.lazy.
const Condition: z.ZodType<unknown> = z.lazy(() =>
  z.union([
    BaseCondition,
    z.object({ and: z.array(Condition) }),
    z.object({ or: z.array(Condition) }),
    z.object({ not: Condition }),
  ]),
);

const HeroTargetTok = z.enum([
  'self',
  'active',
  'any_hero',
  'any_ally',
  'each_hero',
  'each_ally',
  'next_hero',
]);

const DamageTargetTok = z.enum([
  'queue_head',
  'boss',
  'active_hero',
  'any_hero_not_self',
]);

const MonsterPick = z.object({
  pick: z.enum(['monster_in_self_queue', 'monster_in_any_queue', 'queue_head_self']),
  where: z.enum(['has_damage', 'at_most_life_N', 'vie_eq_1']).optional(),
  N: z.number().int().optional(),
});

const QueueDest = z.object({
  to: z.enum(['self_queue_tail', 'next_hero_queue_tail', 'ally_queue_tail', 'self_queue_head']),
});

const OpAttack = z.object({
  op: z.literal('attack'),
  target: z.union([DamageTargetTok, MonsterPick]).optional(),
  amount: z.number().int().optional(),
});

const OpDamage = z.object({
  op: z.literal('damage'),
  target: z.union([DamageTargetTok, MonsterPick]),
  amount: z.number().int().nonnegative(),
});

const OpHeal = z.object({
  op: z.literal('heal'),
  target: HeroTargetTok,
  amount: z.number().int().positive(),
});

const OpDraw = z.object({
  op: z.literal('draw'),
  target: HeroTargetTok,
  n: z.number().int().positive(),
});

const OpDrawDestin = z.object({
  op: z.literal('drawDestin'),
  target: HeroTargetTok,
  n: z.number().int().positive().optional(),
});

const OpSummon = z.object({
  op: z.literal('summon'),
  target: HeroTargetTok,
  n: z.number().int().positive().optional(),
});

const OpEliminate = z.object({
  op: z.literal('eliminate'),
  target: MonsterPick,
});

const OpMoveMonster = z.object({
  op: z.literal('moveMonster'),
  from: MonsterPick,
  to: QueueDest,
});

const OpRegenCapacite = z.object({
  op: z.literal('regenCapacite'),
  target: HeroTargetTok,
});

const OpDiscard = z.object({
  op: z.literal('discard'),
  target: HeroTargetTok,
  n: z.number().int().positive(),
  random: z.boolean().optional(),
});

const OpRequire = z.object({
  op: z.literal('require'),
  cond: Condition,
});

const OpBossActif = z.object({
  op: z.literal('bossActif'),
});

const OpAttackOrder = z.object({
  op: z.literal('attackOrder'),
  target: z.enum(['self', 'each_hero']),
});

const OpIgnorePrereqNext = z.object({
  op: z.literal('ignorePrereqNext'),
});

const OpDrawPerSelfWound = z.object({
  op: z.literal('drawPerSelfWound'),
});

const OpRallyToSelf = z.object({
  op: z.literal('rallyToSelf'),
});

const OpGiveCardsFromAllies = z.object({
  op: z.literal('giveCardsFromAllies'),
});

const OpGiveCardsToAllies = z.object({
  op: z.literal('giveCardsToAllies'),
});

const OpGrantExtraPose = z.object({
  op: z.literal('grantExtraPose'),
});

const OpSwapHandWithAlly = z.object({
  op: z.literal('swapHandWithAlly'),
});

const OpSwapObjectsWithAlly = z.object({
  op: z.literal('swapObjectsWithAlly'),
});

const OpGiftCardsToAlly = z.object({
  op: z.literal('giftCardsToAlly'),
  n: z.number().int().positive(),
  healPerCard: z.number().int().nonnegative().optional(),
});

const OpScryChasse = z.object({
  op: z.literal('scryChasse'),
  look: z.number().int().positive(),
  keep: z.number().int().nonnegative(),
});

const OpAttackChain = z.object({
  op: z.literal('attackChain'),
  amount: z.number().int().positive(),
});

const OpHealEqualsActionsThisTurn = z.object({ op: z.literal('healEqualsActionsThisTurn') });
const OpHealEqualsDrawsThisTurn = z.object({ op: z.literal('healEqualsDrawsThisTurn') });
const OpEliminateIfActionsThisTurn = z.object({
  op: z.literal('eliminateIfActionsThisTurn'),
  minActions: z.number().int().positive(),
  from: z.enum(['monster_in_self_queue', 'monster_in_any_queue']),
});
const OpDrawFromDiscard = z.object({
  op: z.literal('drawFromDiscard'),
  target: z.enum(['self', 'any_ally']),
  n: z.number().int().positive(),
});
const OpRedistributeWounds = z.object({ op: z.literal('redistributeWounds') });
const OpDiscardObject = z.object({
  op: z.literal('discardObject'),
  target: z.enum(['active_hero', 'self']),
  n: z.number().int().positive(),
});
const OpRestrictToDraw = z.object({
  op: z.literal('restrictToDraw'),
  target: z.literal('active_hero'),
});
const OpDiscardHandDrawSame = z.object({
  op: z.literal('discardHandDrawSame'),
  target: z.literal('active_hero'),
});

const OpScoutSolo = z.object({ op: z.literal('scoutSolo') });

const OpRallyHeadsToSelf = z.object({
  op: z.literal('rallyHeadsToSelf'),
  max: z.number().int().positive(),
});
const OpDrawUpTo = z.object({
  op: z.literal('drawUpTo'),
  target: z.literal('self'),
  n: z.number().int().positive(),
});
const OpEliminateAllyHead = z.object({ op: z.literal('eliminateAllyHead') });
const OpReassignHeadToBoss = z.object({ op: z.literal('reassignHeadToBoss') });
const OpHealAllyEqualsSelfWounds = z.object({ op: z.literal('healAllyEqualsSelfWounds') });
const OpDrawWithObjetBonus = z.object({
  op: z.literal('drawWithObjetBonus'),
  target: z.literal('self'),
});
const OpAllyPlaysAction = z.object({ op: z.literal('allyPlaysAction') });
const OpDamageIfHealed = z.object({
  op: z.literal('damageIfHealed'),
  amount: z.number().int().positive(),
});

const OpSetChainOnKill = z.object({ op: z.literal('setChainOnKill') });
const OpRotateHeadsToNext = z.object({ op: z.literal('rotateHeadsToNext') });
const OpSummonOnEmptyQueues = z.object({ op: z.literal('summonOnEmptyQueues') });
const OpCancelDestin = z.object({ op: z.literal('cancelDestin') });
const OpRemoveLastWound = z.object({
  op: z.literal('removeLastWound'),
  target: z.literal('self'),
});

const OpEliminateWhere = z.object({
  op: z.literal('eliminateWhere'),
  from: z.enum(['monster_in_self_queue', 'monster_in_any_queue']),
  where: z.enum(['has_damage', 'at_most_life_N', 'vie_eq_1']).optional(),
  N: z.number().int().optional(),
});

// Recursive — effects inside forEach/choice can reference the full union.
// Plain union rather than discriminatedUnion because z.lazy breaks the latter.
const EffectOp: z.ZodType<unknown> = z.lazy(() =>
  z.union([
    OpAttack,
    OpDamage,
    OpHeal,
    OpDraw,
    OpDrawDestin,
    OpSummon,
    OpEliminate,
    OpEliminateWhere,
    OpMoveMonster,
    OpRegenCapacite,
    OpDiscard,
    OpRequire,
    OpForEach,
    OpChoice,
    OpModifier,
    OpBossDamage,
    OpBossHeal,
    OpShiftDamage,
    OpRemoveAllWounds,
    OpRevive,
    OpCancelMenace,
    OpMoveSelfMonsterToHead,
    OpPlayMoreActions,
    OpOpenFreeExchange,
    OpBossActif,
    OpAttackOrder,
    OpIgnorePrereqNext,
    OpDrawPerSelfWound,
    OpRallyToSelf,
    OpGiveCardsFromAllies,
    OpGiveCardsToAllies,
    OpGrantExtraPose,
    OpSwapHandWithAlly,
    OpSwapObjectsWithAlly,
    OpGiftCardsToAlly,
    OpScryChasse,
    OpAttackChain,
    OpHealEqualsActionsThisTurn,
    OpHealEqualsDrawsThisTurn,
    OpEliminateIfActionsThisTurn,
    OpDrawFromDiscard,
    OpRedistributeWounds,
    OpDiscardObject,
    OpRestrictToDraw,
    OpDiscardHandDrawSame,
    OpScoutSolo,
    OpRallyHeadsToSelf,
    OpDrawUpTo,
    OpEliminateAllyHead,
    OpReassignHeadToBoss,
    OpHealAllyEqualsSelfWounds,
    OpDrawWithObjetBonus,
    OpAllyPlaysAction,
    OpDamageIfHealed,
    OpSetChainOnKill,
    OpRotateHeadsToNext,
    OpSummonOnEmptyQueues,
    OpCancelDestin,
    OpRemoveLastWound,
  ]),
);

const OpForEach: z.ZodType<unknown> = z.lazy(() =>
  z.object({
    op: z.literal('forEach'),
    over: z.enum(['each_hero', 'each_ally']),
    do: z.array(EffectOp),
  }),
);

const OpChoice: z.ZodType<unknown> = z.lazy(() =>
  z.object({
    op: z.literal('choice'),
    who: z.enum(['active', 'any_hero']).optional(),
    options: z.array(
      z.object({
        label: z.string(),
        ops: z.array(EffectOp),
      }),
    ).min(2),
  }),
);

const ModifierEffect = z.discriminatedUnion('kind', [
  z.object({ kind: z.literal('no_damage'), seat: z.number().int() }),
  z.object({ kind: z.literal('heal_cap'), max: z.number().int().nonnegative() }),
  z.object({
    kind: z.literal('bonus_damage_next'),
    seat: z.number().int(),
    amount: z.number().int().nonnegative(),
  }),
]);

const OpModifier = z.object({
  op: z.literal('modifier'),
  effect: ModifierEffect,
  scope: z.enum(['thisTurn', 'nextDamageToSelf', 'nextAttackByActive']),
  target: z.literal('self').optional(),
});

const OpBossDamage = z.object({
  op: z.literal('bossDamage'),
  amount: z.number().int().positive(),
});
const OpBossHeal = z.object({
  op: z.literal('bossHeal'),
  amount: z.number().int().positive(),
});
const OpShiftDamage = z.object({
  op: z.literal('shiftDamage'),
  from: z.enum(['self', 'any_hero', 'any_ally']),
  to: z.union([
    z.enum(['self', 'any_hero', 'any_ally', 'queue_head', 'boss']),
    MonsterPick,
  ]),
  amount: z.number().int().positive(),
});
const OpRemoveAllWounds = z.object({
  op: z.literal('removeAllWounds'),
  target: HeroTargetTok,
});
const OpRevive = z.object({
  op: z.literal('revive'),
  target: z.literal('any_dead_hero'),
  heal: z.number().int().nonnegative().optional(),
});
const OpCancelMenace = z.object({
  op: z.literal('cancelMenace'),
});
const OpMoveSelfMonsterToHead = z.object({
  op: z.literal('moveSelfMonsterToHead'),
});
const OpPlayMoreActions = z.object({
  op: z.literal('playMoreActions'),
  n: z.number().int().positive(),
  restrictTo: z.literal('play_action_only').optional(),
});
const OpOpenFreeExchange = z.object({
  op: z.literal('openFreeExchange'),
  maxSwaps: z.number().int().positive().optional(),
});

const TriggerOps = z.object({
  onArrive: z.array(EffectOp).optional(),
  onAttack: z.array(EffectOp).optional(),
  onDamage: z.array(EffectOp).optional(),
  onEliminate: z.array(EffectOp).optional(),
});

const PassifModifierEntry = z.object({
  effect: ModifierEffect,
  scope: z.enum(['thisTurn', 'nextDamageToSelf', 'nextAttackByActive']),
});

const PassifHook = z.enum([
  'attack_order_next_queue_too',
  'max_draws_per_turn_1',
  'hand_cap_6_end_of_turn',
  'hand_cap_5_end_of_turn',
  'damage_unhealable_from_menace',
  'reshuffle_heals_boss_2',
  'active_discards_top_chasse_on_action',
  'akkoro_damage_discards_chasse',
  'invunche_draw_destin_on_damage',
  'invunche_damage_marks_capacite_used',
  'heal_cap_1',
  'boss_receives_max_1_damage_per_turn',
  'boss_before_heroes',
  'attack_order_all_queues',
  'kaggen_elim_draws_chasse',
]);

const ReactiveTriggerEnum = z.enum([
  'on_self_damage',
  'on_ally_damage',
  'on_self_lethal_damage',
  'on_self_eliminates_monster',
  'on_self_capacite_used',
  'on_ally_capacite_used',
  'on_destin_drawn_any',
  'on_menace_revealed',
  'on_monster_attacks_self',
  'on_third_monster_arrives_self',
  'on_self_played_2_actions',
  'on_self_low_hand',
  'on_self_high_hand_draw',
  'on_self_exchange',
  'on_self_heals_ally',
]);

const ReactiveEntry = z.object({
  trigger: ReactiveTriggerEnum,
  ops: z.array(EffectOp).min(1),
});

export const CardEffectEntrySchema = z.object({
  effet: z.string().optional(),
  ops: z.array(EffectOp).min(1).optional(),
  tag: z.string().optional(),
  triggers: TriggerOps.optional(),
  reactive: ReactiveEntry.optional(),
  actif_ops: z.array(EffectOp).optional(),
  passif_modifiers: z.array(PassifModifierEntry).optional(),
  passif_hooks: z.array(PassifHook).optional(),
}).refine(
  (v) =>
    v.ops || v.triggers || v.reactive || v.actif_ops || v.passif_modifiers || v.passif_hooks,
  { message: 'entry must have at least one of: ops, triggers, reactive, actif_ops, passif_modifiers, passif_hooks' },
);

export const EffectsCatalogSchema = z.record(z.string(), CardEffectEntrySchema);

/** Top-level file schema (wrapping `_meta` + `cards`). */
export const EffectsFileSchema = z.object({
  _meta: z.object({}).passthrough().optional(),
  cards: EffectsCatalogSchema,
});
