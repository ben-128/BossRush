/**
 * Icon string parsing.
 *
 * Design JSONs store icons as `<ico:name>` tokens. This module converts them
 * to the typed `BossIcon` union used by the engine.
 */

import type { BossIcon } from './events.js';

const ICON_MAP: Record<string, BossIcon> = {
  '<ico:menace>': 'menace',
  '<ico:invocation>': 'invocation',
  '<ico:attaque>': 'attaque',
  '<ico:actif_boss>': 'actif_boss',
  '<ico:destin>': 'destin',
};

/** Convert an icon token to its enum value. Throws if unknown. */
export function parseBossIcon(token: string): BossIcon {
  const trimmed = token.trim();
  const val = ICON_MAP[trimmed];
  if (!val) {
    throw new Error(`Unknown boss icon token: "${token}"`);
  }
  return val;
}

/** Parse a whole sequence array (from BossStats.sequence). */
export function parseBossSequence(seq: readonly string[]): BossIcon[] {
  return seq.map(parseBossIcon);
}
