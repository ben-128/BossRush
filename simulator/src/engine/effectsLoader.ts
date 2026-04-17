/**
 * Load simulator/data/effects.json.
 *
 * Returns a map `cardId -> CardEffectEntry`. Unknown ids print a warning to
 * stderr at development time (they're not errors — cards simply fall back to
 * the J2 "raw degats" behaviour).
 */

import { readFile } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { existsSync } from 'node:fs';

import { EffectsFileSchema } from './effectSchemas.js';
import type { EffectsCatalog, CardEffectEntry } from './effectTypes.js';

const __dirname = dirname(fileURLToPath(import.meta.url));
const DEFAULT_PATH = resolve(__dirname, '..', '..', 'data', 'effects.json');

export async function loadEffectsCatalog(path: string = DEFAULT_PATH): Promise<EffectsCatalog> {
  if (!existsSync(path)) {
    // Absence is fine — engine falls back to raw degats resolution.
    return {};
  }
  const raw = await readFile(path, 'utf-8');
  const parsed = JSON.parse(raw) as unknown;
  const result = EffectsFileSchema.safeParse(parsed);
  if (!result.success) {
    const detail = result.error.issues
      .map((i) => `  ${i.path.join('.') || '<root>'}: ${i.message}`)
      .join('\n');
    throw new Error(`Invalid effects.json:\n${detail}`);
  }
  return result.data.cards as EffectsCatalog;
}

export function getCardEffect(
  catalog: EffectsCatalog,
  cardId: string,
): CardEffectEntry | undefined {
  return catalog[cardId];
}
