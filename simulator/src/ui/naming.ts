/**
 * Helpers to resolve card IDs to their display names.
 * All the UI uses these to show "Boule de feu" instead of "MAG_A02".
 */

import type { DesignData } from '../engine/types.js';

export function chasseName(design: DesignData, id: string): string {
  return design.cartesChasse.find((c) => c.id === id)?.nom ?? id;
}

export function monstreName(design: DesignData, id: string): string {
  return design.monstres.find((m) => m.id === id)?.nom ?? id;
}

export function heroName(design: DesignData, id: string): string {
  return design.heroes.find((h) => h.id === id)?.nom ?? id;
}

export function bossName(design: DesignData, id: string): string {
  return design.boss.find((b) => b.id === id)?.nom ?? id;
}

/** Boss name with difficulty suffix, e.g. "Hobab (facile)". */
export function bossLabel(design: DesignData, id: string): string {
  const b = design.boss.find((x) => x.id === id);
  if (!b) return id;
  return `${b.nom} (${b.difficulte})`;
}

export function menaceName(design: DesignData, id: string): string {
  return design.menaces.find((m) => m.id === id)?.nom ?? id;
}

export function destinName(design: DesignData, id: string): string {
  return design.destins.find((d) => d.id === id)?.titre ?? id;
}
