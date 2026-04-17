#!/usr/bin/env node
/**
 * Copie les JSON de design depuis BossRush/Assets/Data/ vers simulator/public/data/.
 *
 * Les JSON Unity sont la SEULE source de vérité pour les données de design.
 * Ce script les rend disponibles au moteur du simulateur en lecture pure.
 * Le simulateur ne modifie jamais les JSON sources.
 */

import { mkdir, copyFile, readdir, stat } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import { dirname, join, relative } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const simulatorRoot = dirname(__dirname);
const repoRoot = dirname(simulatorRoot);

const SOURCES = [
  { from: 'BossRush/Assets/Data/cartes', to: 'public/data/cartes', ext: '.json' },
  { from: 'BossRush/Assets/Data/regles', to: 'public/data/regles', ext: '.json' },
];

async function copyDir(srcDir, dstDir, ext) {
  if (!existsSync(srcDir)) {
    throw new Error(`Source directory missing: ${srcDir}`);
  }
  await mkdir(dstDir, { recursive: true });
  const entries = await readdir(srcDir);
  let count = 0;
  for (const entry of entries) {
    const srcPath = join(srcDir, entry);
    const dstPath = join(dstDir, entry);
    const info = await stat(srcPath);
    if (info.isDirectory()) continue;
    if (!entry.endsWith(ext)) continue;
    await copyFile(srcPath, dstPath);
    count++;
  }
  return count;
}

async function main() {
  console.log('[sync-data] Copying Unity design JSONs to simulator/public/data/');
  let total = 0;
  for (const src of SOURCES) {
    const srcAbs = join(repoRoot, src.from);
    const dstAbs = join(simulatorRoot, src.to);
    const n = await copyDir(srcAbs, dstAbs, src.ext);
    const rel = relative(repoRoot, srcAbs);
    console.log(`  ${rel} -> simulator/${src.to}  (${n} files)`);
    total += n;
  }
  console.log(`[sync-data] Done. ${total} files copied.`);
}

main().catch((err) => {
  console.error('[sync-data] FAILED:', err.message);
  process.exit(1);
});
