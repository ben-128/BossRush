/**
 * Node-side disk loader for design JSONs. Reads files then delegates validation
 * to `parseDesignData` (browser-safe).
 *
 * The browser uses `parseDesignData` directly from src/ui/browserLoader.ts.
 */

import { readFile } from 'node:fs/promises';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

import { parseDesignData, DesignDataError } from './parseDesignData.js';
import type { DesignData } from './types.js';

// Re-export for backward compatibility.
export { parseDesignData, DesignDataError };

const __dirname = dirname(fileURLToPath(import.meta.url));
const DEFAULT_DATA_DIR = resolve(__dirname, '..', '..', 'public', 'data', 'cartes');

async function readJson(path: string): Promise<unknown> {
  const raw = await readFile(path, 'utf-8');
  try {
    return JSON.parse(raw);
  } catch (err) {
    throw new Error(`Invalid JSON at ${path}: ${(err as Error).message}`);
  }
}

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
