import { useState } from 'react';
import { useStore } from './store.js';
import { runBatch, rowsToCsv, type BatchOptions, type BatchResult } from '../sim/runBatch.js';

/**
 * Browser-side batch panel: fill form, click Run, get results + download
 * buttons. Runs entirely in the browser — no server, no CLI.
 */

function download(filename: string, content: string, mime = 'text/plain'): void {
  const blob = new Blob([content], { type: mime });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

export function Batch() {
  const design = useStore((s) => s.design);
  const effects = useStore((s) => s.effects);
  const replayFromRow = useStore((s) => s.replayFromRow);

  const [runs, setRuns] = useState(100);
  const [boss, setBoss] = useState('random');
  const [players, setPlayers] = useState(3);
  const [heroes, setHeroes] = useState('random');
  const [policy, setPolicy] = useState<'random' | 'heuristic'>('heuristic');
  const [choicePolicy, setChoicePolicy] = useState<'random' | 'heuristic'>('heuristic');
  const [seedStart, setSeedStart] = useState(1);
  const [keepEvents, setKeepEvents] = useState(false);

  const [progress, setProgress] = useState<{ done: number; total: number } | null>(null);
  const [result, setResult] = useState<BatchResult | null>(null);
  const [running, setRunning] = useState(false);

  if (!design) {
    return <div className="p-6 text-stone-400">Données non chargées.</div>;
  }

  const go = () => {
    const opts: BatchOptions = {
      runs,
      boss,
      players,
      heroes,
      policy,
      choicePolicy,
      seedStart,
      keepEvents,
    };
    setRunning(true);
    setResult(null);
    setProgress({ done: 0, total: runs });
    // Defer to next tick so spinner shows.
    setTimeout(() => {
      try {
        const res = runBatch(design, effects, opts, (done, total) => {
          setProgress({ done, total });
        });
        setResult(res);
        setProgress({ done: runs, total: runs });
      } finally {
        setRunning(false);
      }
    }, 20);
  };

  const downloadCsv = () => {
    if (!result) return;
    download(`summary_${Date.now()}.csv`, rowsToCsv(result.rows), 'text/csv');
  };
  const downloadStats = () => {
    if (!result) return;
    download(
      `stats_${Date.now()}.json`,
      JSON.stringify(result.stats, null, 2),
      'application/json',
    );
  };
  const downloadGame = (idx: number) => {
    if (!result) return;
    const r = result.rows[idx];
    if (!r?.eventLog) return;
    download(
      `game_${r.seed}.jsonl`,
      r.eventLog.map((e) => JSON.stringify(e)).join('\n') + '\n',
      'application/x-ndjson',
    );
  };

  return (
    <div className="p-4 space-y-4 overflow-auto h-[calc(100vh-3rem)]">
      <section className="border border-stone-700 rounded p-4 bg-stone-950/50">
        <h2 className="text-sm uppercase tracking-wider text-stone-400 mb-3">Configuration</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
          <Field label="Runs">
            <input
              type="number"
              value={runs}
              onChange={(e) => setRuns(Math.max(1, parseInt(e.target.value || '1', 10)))}
              className="w-full bg-stone-800 border border-stone-700 rounded px-2 py-1"
            />
          </Field>
          <Field label="Joueurs (2-5)">
            <input
              type="number"
              min={2}
              max={5}
              value={players}
              onChange={(e) => setPlayers(Math.max(2, Math.min(5, parseInt(e.target.value || '3', 10))))}
              className="w-full bg-stone-800 border border-stone-700 rounded px-2 py-1"
            />
          </Field>
          <Field label="Seed début">
            <input
              type="number"
              value={seedStart}
              onChange={(e) => setSeedStart(parseInt(e.target.value || '1', 10))}
              className="w-full bg-stone-800 border border-stone-700 rounded px-2 py-1"
            />
          </Field>
          <Field label="Policy">
            <select
              value={policy}
              onChange={(e) => setPolicy(e.target.value as 'random' | 'heuristic')}
              className="w-full bg-stone-800 border border-stone-700 rounded px-2 py-1"
            >
              <option value="heuristic">heuristic</option>
              <option value="random">random</option>
            </select>
          </Field>
          <Field label="Boss">
            <select
              value={boss}
              onChange={(e) => setBoss(e.target.value)}
              className="w-full bg-stone-800 border border-stone-700 rounded px-2 py-1"
            >
              <option value="random">random</option>
              {design.boss.map((b) => (
                <option key={b.id} value={b.id}>
                  {b.id} — {b.nom}
                </option>
              ))}
            </select>
          </Field>
          <Field label="Héros (csv ou 'random')">
            <input
              value={heroes}
              onChange={(e) => setHeroes(e.target.value)}
              placeholder="random ou HERO_001,HERO_003,HERO_005"
              className="w-full bg-stone-800 border border-stone-700 rounded px-2 py-1"
            />
          </Field>
          <Field label="Choice policy">
            <select
              value={choicePolicy}
              onChange={(e) => setChoicePolicy(e.target.value as 'random' | 'heuristic')}
              className="w-full bg-stone-800 border border-stone-700 rounded px-2 py-1"
            >
              <option value="heuristic">heuristic</option>
              <option value="random">random</option>
            </select>
          </Field>
          <Field label="Garder events par partie">
            <label className="flex items-center gap-2 text-xs">
              <input
                type="checkbox"
                checked={keepEvents}
                onChange={(e) => setKeepEvents(e.target.checked)}
              />
              <span className="text-stone-400">
                nécessaire pour télécharger les JSONL individuels
              </span>
            </label>
          </Field>
        </div>
        <div className="mt-4 flex items-center gap-3">
          <button
            onClick={go}
            disabled={running}
            className="px-4 py-2 bg-emerald-700 hover:bg-emerald-600 rounded disabled:opacity-40"
          >
            {running ? 'En cours…' : `Lancer ${runs} parties`}
          </button>
          {progress && (
            <div className="flex-1 max-w-md">
              <div className="text-xs text-stone-400 mb-1">
                {progress.done}/{progress.total} parties
              </div>
              <div className="h-2 bg-stone-800 rounded overflow-hidden">
                <div
                  className="h-full bg-emerald-500 transition-all"
                  style={{ width: `${(progress.done / Math.max(1, progress.total)) * 100}%` }}
                />
              </div>
            </div>
          )}
        </div>
      </section>

      {result && (
        <section className="space-y-3">
          <div className="flex items-center gap-3">
            <h2 className="text-sm uppercase tracking-wider text-stone-400 flex-1">
              Résultats — {result.stats.durationMs}ms
            </h2>
            <button onClick={downloadStats} className="px-3 py-1.5 bg-stone-700 hover:bg-stone-600 rounded text-sm">
              ⬇ stats.json
            </button>
            <button onClick={downloadCsv} className="px-3 py-1.5 bg-stone-700 hover:bg-stone-600 rounded text-sm">
              ⬇ summary.csv
            </button>
          </div>

          <div className="grid grid-cols-4 gap-3">
            <Kpi label="Runs" value={result.stats.runs} />
            <Kpi
              label="Winrate"
              value={`${(result.stats.winrate * 100).toFixed(1)}%`}
              accent={result.stats.winrate >= 0.5 ? 'emerald' : 'red'}
            />
            <Kpi label="Tours moyens" value={result.stats.meanTurns.toFixed(1)} />
            <Kpi
              label="Vic / Def"
              value={`${result.stats.meanTurnsVictory?.toFixed(1) ?? '—'} / ${result.stats.meanTurnsDefeat?.toFixed(1) ?? '—'}`}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <Panel title="Par boss">
              <MiniTable
                cols={['Boss', 'W', 'D', '%']}
                rows={Object.entries(result.stats.byBoss)
                  .sort((a, b) => b[1].winrate - a[1].winrate)
                  .map(([b, v]) => [b, v.wins, v.defeats, `${(v.winrate * 100).toFixed(1)}%`])}
              />
            </Panel>
            <Panel title="Par héros">
              <MiniTable
                cols={['Héros', 'Parties', 'Morts', '%']}
                rows={Object.entries(result.stats.byHero)
                  .sort((a, b) => a[1].deathRate - b[1].deathRate)
                  .map(([h, v]) => [h, v.games, v.deaths, `${(v.deathRate * 100).toFixed(1)}%`])}
              />
            </Panel>
          </div>

          <Panel title="Top cartes jouées">
            <MiniTable
              cols={['Card', 'Count']}
              rows={result.stats.topPlayedCards.slice(0, 15)}
            />
          </Panel>

          <div>
            <h3 className="text-sm uppercase tracking-wider text-stone-400 mb-2">
              Parties ({result.rows.length})
            </h3>
            <div className="border border-stone-700 rounded bg-stone-950/50 overflow-auto max-h-[50vh]">
              <table className="w-full text-xs font-mono">
                <thead className="bg-stone-900 sticky top-0">
                  <tr>
                    <th className="px-2 py-1 text-left">Seed</th>
                    <th className="px-2 py-1 text-left">Boss</th>
                    <th className="px-2 py-1 text-left">Héros</th>
                    <th className="px-2 py-1 text-left">Résultat</th>
                    <th className="px-2 py-1 text-right">Tours</th>
                    <th className="px-2 py-1"></th>
                  </tr>
                </thead>
                <tbody>
                  {result.rows.slice(0, 500).map((r, i) => (
                    <tr key={i} className="border-t border-stone-800 hover:bg-stone-900">
                      <td className="px-2 py-1">{r.seed}</td>
                      <td className="px-2 py-1">{r.boss}</td>
                      <td className="px-2 py-1 text-stone-400">{r.heroes.join(', ')}</td>
                      <td className={`px-2 py-1 ${r.result === 'victory' ? 'text-emerald-400' : 'text-red-400'}`}>
                        {r.result}
                      </td>
                      <td className="px-2 py-1 text-right">{r.turns}</td>
                      <td className="px-2 py-1">
                        <button
                          onClick={() =>
                            replayFromRow({
                              seed: String(r.seed),
                              boss: r.boss,
                              heroes: r.heroes,
                            })
                          }
                          className="px-2 py-0.5 bg-sky-700 hover:bg-sky-600 rounded mr-1"
                        >
                          Rejouer
                        </button>
                        {keepEvents && r.eventLog && (
                          <button
                            onClick={() => downloadGame(i)}
                            className="px-2 py-0.5 bg-stone-700 hover:bg-stone-600 rounded"
                          >
                            ⬇
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {result.rows.length > 500 && (
                <div className="p-2 text-xs text-stone-500 text-center border-t border-stone-800">
                  Premières 500 lignes affichées ({result.rows.length} au total).
                </div>
              )}
            </div>
          </div>
        </section>
      )}
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <div className="text-xs text-stone-400 mb-1">{label}</div>
      {children}
    </div>
  );
}

function Kpi({ label, value, accent }: { label: string; value: string | number; accent?: 'emerald' | 'red' }) {
  const color =
    accent === 'emerald' ? 'text-emerald-400' : accent === 'red' ? 'text-red-400' : 'text-stone-100';
  return (
    <div className="border border-stone-700 rounded p-3 bg-stone-950/50">
      <div className="text-xs text-stone-400 uppercase">{label}</div>
      <div className={`text-2xl font-semibold ${color}`}>{value}</div>
    </div>
  );
}

function Panel({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="border border-stone-700 rounded p-3 bg-stone-950/50">
      <div className="text-xs text-stone-400 uppercase mb-2">{title}</div>
      {children}
    </div>
  );
}

function MiniTable({ cols, rows }: { cols: string[]; rows: Array<Array<string | number>> }) {
  return (
    <table className="text-xs w-full font-mono">
      <thead>
        <tr className="text-stone-400">
          {cols.map((c, i) => (
            <th key={c} className={i === 0 ? 'text-left' : 'text-right'}>
              {c}
            </th>
          ))}
        </tr>
      </thead>
      <tbody>
        {rows.map((r, i) => (
          <tr key={i}>
            {r.map((v, j) => (
              <td key={j} className={j === 0 ? 'text-left' : 'text-right'}>
                {v}
              </td>
            ))}
          </tr>
        ))}
      </tbody>
    </table>
  );
}
