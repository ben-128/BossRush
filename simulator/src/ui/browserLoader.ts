/**
 * Browser-side data loader.
 *
 * Fetches the 6 Unity JSONs from /data/cartes/ (served via public/data/ by Vite)
 * and bundles simulator/data/effects.json via a plain import (Vite treats JSON
 * as a module).
 */

import { parseDesignData } from '../engine/parseDesignData.js';
import { EffectsFileSchema } from '../engine/effectSchemas.js';
import type { EffectsCatalog } from '../engine/effectTypes.js';

// Bundled at build time. Runtime validation still applies in loadEffects().
import effectsRaw from '../../data/effects.json';

async function fetchJson(url: string): Promise<unknown> {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Failed to fetch ${url}: ${res.status}`);
  return res.json();
}

export async function loadAllData() {
  const base = '/data/cartes';
  const [heroes, boss, cartesChasse, monstres, menaces, destins] = await Promise.all([
    fetchJson(`${base}/heroes.json`),
    fetchJson(`${base}/boss.json`),
    fetchJson(`${base}/cartes_Chasse.json`),
    fetchJson(`${base}/monstres.json`),
    fetchJson(`${base}/Menaces.json`),
    fetchJson(`${base}/destins.json`),
  ]);
  const design = parseDesignData({ heroes, boss, cartesChasse, monstres, menaces, destins });
  const effectsParsed = EffectsFileSchema.safeParse(effectsRaw);
  if (!effectsParsed.success) {
    throw new Error(
      'Invalid bundled effects.json: ' +
        effectsParsed.error.issues.map((i) => `${i.path.join('.')} ${i.message}`).join('; '),
    );
  }
  const effects = effectsParsed.data.cards as EffectsCatalog;
  return { design, effects };
}
