/**
 * Zod schemas for all design JSONs.
 *
 * These schemas are the single source of truth for data shapes.
 * TypeScript types are inferred from them (see `types.ts`).
 *
 * Validation runs at load time (see `loader.ts`). Any shape drift in the
 * Unity JSONs will be caught immediately with an explicit error path.
 */

import { z } from 'zod';

// ---------------------------------------------------------------------------
// Generic meta block (common to all JSONs)
// ---------------------------------------------------------------------------

const MetaSchema = z.object({}).passthrough();

// ---------------------------------------------------------------------------
// Heroes
// ---------------------------------------------------------------------------

export const CompetenceSchema = z.enum([
  'armure',
  'soin',
  'magie',
  'distance',
  'diplomatie',
]);

export const HeroSchema = z.object({
  id: z.string(),
  nom: z.string(),
  titre: z.string(),
  vie: z.number().int().positive(),
  competences: z.array(CompetenceSchema).min(1),
  capacite_speciale: z.string(),
  citation: z.string().optional(),
});

export const HeroesFileSchema = z.object({
  meta: MetaSchema,
  heroes: z.array(HeroSchema).min(1),
});

// ---------------------------------------------------------------------------
// Boss
// ---------------------------------------------------------------------------

export const DifficulteSchema = z.enum([
  'facile',
  'moyen',
  'difficile',
  'très difficile',
]);

export const BossStatsSchema = z.object({
  sequence: z.array(z.string()).min(1), // icons as <ico:menace>, <ico:invocation>, etc.
  passif: z.string(),
  actif: z.string(),
});

export const BossSchema = z.object({
  id: z.string(),
  nom: z.string(),
  difficulte: DifficulteSchema,
  vie_multiplicateur: z.number().int().positive(),
  stats: BossStatsSchema,
  monstres_ids: z.array(z.string()).default([]),
  lore_md: z.string().optional(),
  lore: z.string().optional(),
});

export const BossFileSchema = z.object({
  meta: MetaSchema,
  boss: z.array(BossSchema).min(1),
});

// ---------------------------------------------------------------------------
// Cartes Chasse (Actions + Objets)
// ---------------------------------------------------------------------------

export const CategorieChasseSchema = z.enum(['action', 'objet']);

export const CarteChasseSchema = z.object({
  id: z.string(),
  nom: z.string(),
  categorie: CategorieChasseSchema,
  degats: z.number().int().nonnegative().optional(),
  bonus_degats: z.number().int().nonnegative().optional(),
  prerequis: z.string(),
  effet: z.string().optional(),
  quantite: z.number().int().positive(),
});

export const CartesChasseFileSchema = z.object({
  meta: MetaSchema,
  cartes_arsenal: z.array(CarteChasseSchema).min(1),
});

// ---------------------------------------------------------------------------
// Monstres
// ---------------------------------------------------------------------------

export const MonstreSchema = z.object({
  id: z.string(),
  nom: z.string(),
  vie: z.number().int().positive(),
  degats: z.number().int().nonnegative(),
  capacite_speciale: z.string().nullable(),
  description: z.string().optional(),
  citation: z.string().optional(),
  quantite: z.number().int().positive(),
});

export const MonstresFileSchema = z.object({
  meta: MetaSchema,
  monstres: z.array(MonstreSchema).min(1),
});

// ---------------------------------------------------------------------------
// Menaces (Assauts + Événements)
// ---------------------------------------------------------------------------

export const TypeMenaceSchema = z.enum(['assaut', 'evenement']);

export const SousTypeAssautSchema = z.enum([
  'ordre_attaque',
  'attaque',
  'invocation',
  'ordre_attaque_special',
  'attaque_speciale',
  'invocation_speciale',
]);

export const MenaceSchema = z.object({
  id: z.string(),
  type: TypeMenaceSchema.optional(), // EPR_016 lacks "type" in source — tolerated
  sous_type: SousTypeAssautSchema.optional(),
  nom: z.string(),
  description: z.string(),
  degats: z.number().int().nonnegative().optional(),
});

export const MenacesFileSchema = z.object({
  meta: MetaSchema,
  epreuves: z.array(MenaceSchema).min(1),
});

// ---------------------------------------------------------------------------
// Destins
// ---------------------------------------------------------------------------

export const TypeDestinSchema = z.enum(['positif', 'negatif', 'ambigu']);

export const DestinSchema = z.object({
  id: z.string(),
  type: TypeDestinSchema,
  titre: z.string(),
  effet: z.string(),
  lore: z.string().optional(),
  degats: z.number().int().nonnegative().optional(),
});

export const DestinsFileSchema = z.object({
  meta: MetaSchema,
  destins: z.array(DestinSchema).min(1),
});
