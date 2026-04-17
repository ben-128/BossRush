#!/usr/bin/env tsx
/**
 * Batch runner CLI — writes results to disk.
 *
 * Most of the heavy lifting lives in `sim/runBatch.ts` (shared with the UI).
 */

import { mkdir, writeFile } from 'node:fs/promises';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

import { loadDesignData } from '../engine/loader.js';
import { loadEffectsCatalog } from '../engine/effectsLoader.js';
import { runBatch, rowsToCsv, type BatchOptions } from '../sim/runBatch.js';

const __dirname = dirname(fileURLToPath(import.meta.url));
const SIM_ROOT = resolve(__dirname, '..', '..');

function parseArgs(): BatchOptions & { out: string; keepLogs: 'none' | 'all' | 'anomalies'; verbose: boolean } {
  const argv = process.argv.slice(2);
  const get = (flag: string, fallback: string): string => {
    const i = argv.indexOf(flag);
    if (i < 0) return fallback;
    return argv[i + 1] ?? fallback;
  };
  const ts = new Date().toISOString().replace(/[:.]/g, '-');
  const keepLogs = get('--keepLogs', 'all') as 'none' | 'all' | 'anomalies';
  return {
    runs: parseInt(get('--runs', '100'), 10),
    boss: get('--boss', 'BOSS_001'),
    players: parseInt(get('--players', '3'), 10),
    heroes: get('--heroes', 'random'),
    policy: get('--policy', 'heuristic') as 'random' | 'heuristic',
    choicePolicy: get('--choicePolicy', 'heuristic') as 'random' | 'heuristic',
    seedStart: parseInt(get('--seedStart', '1'), 10),
    keepEvents: keepLogs !== 'none',
    out: get('--out', join(SIM_ROOT, 'logs', `batch_${ts}`)),
    keepLogs,
    verbose: argv.includes('--verbose'),
  };
}

async function main(): Promise<void> {
  const args = parseArgs();
  const [data, effects] = await Promise.all([loadDesignData(), loadEffectsCatalog()]);

  const outDir = args.out;
  const gamesDir = join(outDir, 'games');
  await mkdir(outDir, { recursive: true });
  if (args.keepLogs !== 'none') await mkdir(gamesDir, { recursive: true });

  const { rows, stats } = runBatch(data, effects, args, (done, total) => {
    if (args.verbose) process.stderr.write(`[batch] ${done}/${total}\n`);
  });

  await writeFile(join(outDir, 'summary.csv'), rowsToCsv(rows), 'utf-8');
  await writeFile(join(outDir, 'stats.json'), JSON.stringify(stats, null, 2), 'utf-8');

  if (args.keepLogs !== 'none') {
    for (let i = 0; i < rows.length; i++) {
      const r = rows[i]!;
      const anomalous = r.turns <= 5 || r.turns >= 199;
      const keep = args.keepLogs === 'all' || (args.keepLogs === 'anomalies' && anomalous);
      if (!keep || !r.eventLog) continue;
      const fname = `${String(i + 1).padStart(5, '0')}_seed${String(r.seed).padStart(6, '0')}.jsonl`;
      const payload = r.eventLog.map((ev) => JSON.stringify(ev)).join('\n') + '\n';
      await writeFile(join(gamesDir, fname), payload, 'utf-8');
    }
  }

  process.stderr.write(
    `[batch] done. ${args.runs} runs in ${stats.durationMs}ms. winrate=${(stats.winrate * 100).toFixed(1)}%. out=${outDir}\n`,
  );
}

main().catch((err) => {
  console.error('[batch] FAILED:', err);
  process.exit(1);
});
