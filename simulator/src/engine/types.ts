/**
 * Design-time types inferred from Zod schemas.
 *
 * Use these types to reference loaded JSON data. Never hand-maintain
 * parallel type declarations — keep schemas as the single source.
 *
 * Runtime GameState types live elsewhere (engine/state.ts, later jalons).
 */

import { z } from 'zod';
import {
  HeroSchema,
  BossSchema,
  CarteChasseSchema,
  MonstreSchema,
  MenaceSchema,
  DestinSchema,
  CompetenceSchema,
  DifficulteSchema,
  CategorieChasseSchema,
  TypeMenaceSchema,
  SousTypeAssautSchema,
  TypeDestinSchema,
} from './schemas.js';

export type Competence = z.infer<typeof CompetenceSchema>;
export type Difficulte = z.infer<typeof DifficulteSchema>;
export type CategorieChasse = z.infer<typeof CategorieChasseSchema>;
export type TypeMenace = z.infer<typeof TypeMenaceSchema>;
export type SousTypeAssaut = z.infer<typeof SousTypeAssautSchema>;
export type TypeDestin = z.infer<typeof TypeDestinSchema>;

export type Hero = z.infer<typeof HeroSchema>;
export type Boss = z.infer<typeof BossSchema>;
export type CarteChasse = z.infer<typeof CarteChasseSchema>;
export type Monstre = z.infer<typeof MonstreSchema>;
export type Menace = z.infer<typeof MenaceSchema>;
export type Destin = z.infer<typeof DestinSchema>;

/**
 * Aggregated design data after loading + validation.
 * This is the read-only catalog the engine reads from.
 */
export interface DesignData {
  heroes: ReadonlyArray<Hero>;
  boss: ReadonlyArray<Boss>;
  cartesChasse: ReadonlyArray<CarteChasse>;
  monstres: ReadonlyArray<Monstre>;
  menaces: ReadonlyArray<Menace>;
  destins: ReadonlyArray<Destin>;
}
