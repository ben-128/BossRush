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

const EffectOp = z.discriminatedUnion('op', [
  OpAttack,
  OpDamage,
  OpHeal,
  OpDraw,
  OpDrawDestin,
  OpSummon,
  OpEliminate,
  OpMoveMonster,
  OpRegenCapacite,
  OpDiscard,
  OpRequire,
]);

export const CardEffectEntrySchema = z.object({
  effet: z.string().optional(),
  ops: z.array(EffectOp).min(1),
  tag: z.string().optional(),
});

export const EffectsCatalogSchema = z.record(z.string(), CardEffectEntrySchema);

/** Top-level file schema (wrapping `_meta` + `cards`). */
export const EffectsFileSchema = z.object({
  _meta: z.object({}).passthrough().optional(),
  cards: EffectsCatalogSchema,
});
