/**
 * Browser-side data loader.
 *
 * In dev, reads the 6 Unity JSONs straight from BossRush/Assets/Data/ via the
 * Vite `liveUnityJson` middleware, and effects.json from simulator/data/ the
 * same way. That means editing any of these files + hitting "Recharger JSONs"
 * (or calling load() again) picks up the changes without a sync step.
 *
 * In production, the same URLs are served from public/ (populated at build).
 */

import { parseDesignData } from '../engine/parseDesignData.js';
import { EffectsFileSchema } from '../engine/effectSchemas.js';
import type { EffectsCatalog } from '../engine/effectTypes.js';

async function fetchJson(url: string): Promise<unknown> {
  // Cache-bust so repeated loads always pull fresh copies after edits.
  const bust = `?t=${Date.now()}`;
  const res = await fetch(url + bust, { cache: 'no-store' });
  if (!res.ok) throw new Error(`Failed to fetch ${url}: ${res.status}`);
  return res.json();
}

export async function loadAllData() {
  const base = '/data/cartes';
  const [heroes, boss, cartesChasse, monstres, menaces, destins, effectsRaw] = await Promise.all([
    fetchJson(`${base}/heroes.json`),
    fetchJson(`${base}/boss.json`),
    fetchJson(`${base}/cartes_Chasse.json`),
    fetchJson(`${base}/monstres.json`),
    fetchJson(`${base}/Menaces.json`),
    fetchJson(`${base}/destins.json`),
    fetchJson(`/data/effects.json`),
  ]);
  const design = parseDesignData({ heroes, boss, cartesChasse, monstres, menaces, destins });
  const effectsParsed = EffectsFileSchema.safeParse(effectsRaw);
  if (!effectsParsed.success) {
    throw new Error(
      'Invalid effects.json: ' +
        effectsParsed.error.issues.map((i) => `${i.path.join('.')} ${i.message}`).join('; '),
    );
  }
  const effects = effectsParsed.data.cards as EffectsCatalog;
  return { design, effects };
}
