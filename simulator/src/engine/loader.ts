/**
 * Loads and validates Unity design JSONs.
 *
 * Node-side loader — reads files from disk under simulator/public/data/.
 * Browser-side loading (fetch) can reuse `parseDesignData` with pre-fetched
 * JSON blobs.
 *
 * Validation is strict. Any shape drift in the Unity JSONs is reported with
 * the exact path of the offending field (Zod pretty-print).
 */

import { readFile } from 'node:fs/promises';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { z } from 'zod';

import {
  HeroesFileSchema,
  BossFileSchema,
  CartesChasseFileSchema,
  MonstresFileSchema,
  MenacesFileSchema,
  DestinsFileSchema,
} from './schemas.js';
import type { DesignData } from './types.js';

const __dirname = dirname(fileURLToPath(import.meta.url));
const DEFAULT_DATA_DIR = resolve(__dirname, '..', '..', 'public', 'data', 'cartes');

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

async function readJson(path: string): Promise<unknown> {
  const raw = await readFile(path, 'utf-8');
  try {
    return JSON.parse(raw);
  } catch (err) {
    throw new Error(`Invalid JSON at ${path}: ${(err as Error).message}`);
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

/**
 * Pure-JSON parse entrypoint. Accepts already-fetched objects, returns an
 * immutable DesignData aggregate. Safe to reuse from the browser.
 */
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

/**
 * Node-side loader. Reads all 6 design JSONs from a directory and validates.
 * Defaults to simulator/public/data/cartes/ (filled by scripts/sync-data.mjs).
 */
export async function loadDesignData(dataDir: string = DEFAULT_DATA_DIR): Promise<DesignData> {
  const [heroes, boss, cartesChasse, monstres, menaces, destins] = await Promise.all([
    readJson(join(dataDir, 'heroes.json')),
    readJson(join(dataDir, 'boss.json')),
    readJson(join(dataDir, 'cartes_Chasse.json')),
    readJson(join(dataDir, 'monstres.json')),
    readJson(join(dataDir, 'Menaces.json')),
    readJson(join(dataDir, 'destins.json')),
  ]);
  return parseDesignData({ heroes, boss, cartesChasse, monstres, menaces, destins });
}
