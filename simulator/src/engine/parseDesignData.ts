/**
 * Browser-safe parsing entrypoint for design data.
 *
 * Split out of loader.ts so the UI bundle doesn't drag in Node built-ins
 * (fs, path, url) via the Node-side `loadDesignData`.
 */

import { z } from 'zod';
import {
  BossFileSchema,
  CartesChasseFileSchema,
  DestinsFileSchema,
  HeroesFileSchema,
  MenacesFileSchema,
  MonstresFileSchema,
} from './schemas.js';
import type { DesignData } from './types.js';

export class DesignDataError extends Error {
  constructor(
    message: string,
    public readonly file: string,
    public readonly issues: readonly z.ZodIssue[],
  ) {
    super(message);
    this.name = 'DesignDataError';
  }
}

function parseOrThrow<S extends z.ZodTypeAny>(
  file: string,
  schema: S,
  payload: unknown,
): z.infer<S> {
  const result = schema.safeParse(payload);
  if (!result.success) {
    const detail = result.error.issues
      .map((i) => `  ${i.path.join('.') || '<root>'}: ${i.message}`)
      .join('\n');
    throw new DesignDataError(
      `Invalid design data in ${file}:\n${detail}`,
      file,
      result.error.issues,
    );
  }
  return result.data;
}

export function parseDesignData(files: {
  heroes: unknown;
  boss: unknown;
  cartesChasse: unknown;
  monstres: unknown;
  menaces: unknown;
  destins: unknown;
}): DesignData {
  const heroes = parseOrThrow('heroes.json', HeroesFileSchema, files.heroes).heroes;
  const boss = parseOrThrow('boss.json', BossFileSchema, files.boss).boss;
  const cartesChasse = parseOrThrow(
    'cartes_Chasse.json',
    CartesChasseFileSchema,
    files.cartesChasse,
  ).cartes_arsenal;
  const monstres = parseOrThrow('monstres.json', MonstresFileSchema, files.monstres).monstres;
  const menaces = parseOrThrow('Menaces.json', MenacesFileSchema, files.menaces).epreuves;
  const destins = parseOrThrow('destins.json', DestinsFileSchema, files.destins).destins;

  return { heroes, boss, cartesChasse, monstres, menaces, destins };
}
