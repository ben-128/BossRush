import { useState } from 'react';
import { useStore } from './store.js';

interface GameRow {
  seed: string;
  boss: string;
  heroes: string[];
  nPlayers: number;
  result: string;
  turns: number;
  bossHpRemaining: number;
  deadHeroes: string;
  events: number;
}

interface Stats {
  runs: number;
  winrate: number;
  wins: number;
  defeats: number;
  meanTurns: number;
  meanTurnsVictory: number | null;
  meanTurnsDefeat: number | null;
  byBoss: Record<string, { wins: number; defeats: number; winrate: number }>;
  byHero: Record<string, { games: number; deaths: number; deathRate: number }>;
  topPlayedCards: Array<[string, number]>;
}

function parseCsv(text: string): GameRow[] {
  const lines = text.trim().split(/\r?\n/);
  if (lines.length <= 1) return [];
  const header = lines[0]!.split(',');
  const idx = (k: string) => header.indexOf(k);
  const i_seed = idx('seed');
  const i_boss = idx('boss');
  const i_heroes = idx('heroes');
  const i_n = idx('nPlayers');
  const i_result = idx('result');
  const i_turns = idx('turns');
  const i_hp = idx('bossHpRemaining');
  const i_dead = idx('deadHeroes');
  const i_events = idx('events');
  return lines.slice(1).map((line) => {
    const cols = splitCsvLine(line);
    return {
      seed: cols[i_seed] ?? '',
      boss: cols[i_boss] ?? '',
      heroes: (cols[i_heroes] ?? '').split('|').filter(Boolean),
      nPlayers: parseInt(cols[i_n] ?? '0', 10),
      result: cols[i_result] ?? '',
      turns: parseInt(cols[i_turns] ?? '0', 10),
      bossHpRemaining: parseInt(cols[i_hp] ?? '0', 10),
      deadHeroes: cols[i_dead] ?? '',
      events: parseInt(cols[i_events] ?? '0', 10),
    };
  });
}

function splitCsvLine(line: string): string[] {
  const out: string[] = [];
  let cur = '';
  let inQ = false;
  for (let i = 0; i < line.length; i++) {
    const ch = line[i]!;
    if (inQ) {
      if (ch === '"' && line[i + 1] === '"') {
        cur += '"';
        i++;
      } else if (ch === '"') {
        inQ = false;
      } else cur += ch;
    } else if (ch === ',') {
      out.push(cur);
      cur = '';
    } else if (ch === '"') {
      inQ = true;
    } else cur += ch;
  }
  out.push(cur);
  return out;
}

export function Dashboard() {
  const replayFromRow = useStore((s) => s.replayFromRow);
  const [stats, setStats] = useState<Stats | null>(null);
  const [rows, setRows] = useState<GameRow[]>([]);
  const [sortKey, setSortKey] = useState<'seed' | 'turns' | 'boss' | 'result'>('seed');
  const [resultFilter, setResultFilter] = useState<'all' | 'victory' | 'defeat'>('all');

  async function loadStats(file: File) {
    const text = await file.text();
    try {
      setStats(JSON.parse(text) as Stats);
    } catch {
      alert('Invalid stats.json');
    }
  }
  async function loadCsv(file: File) {
    const text = await file.text();
    setRows(parseCsv(text));
  }

  const filtered = rows.filter((r) =>
    resultFilter === 'all' ? true : r.result === resultFilter,
  );
  const sorted = [...filtered].sort((a, b) => {
    if (sortKey === 'seed') return parseInt(a.seed, 10) - parseInt(b.seed, 10);
    if (sortKey === 'turns') return b.turns - a.turns;
    if (sortKey === 'boss') return a.boss.localeCompare(b.boss);
    return a.result.localeCompare(b.result);
  });

  return (
    <div className="p-4 space-y-6 overflow-auto h-[calc(100vh-3rem)]">
      <section>
        <h2 className="text-sm uppercase tracking-wider text-stone-400 mb-2">Fichiers de batch</h2>
        <div className="flex gap-4">
          <label className="flex-1 border border-stone-700 rounded p-3 cursor-pointer hover:bg-stone-800 bg-stone-950/50">
            <div className="text-sm font-semibold">stats.json</div>
            <div className="text-xs text-stone-400">Agrégats du batch</div>
            <input
              type="file"
              accept=".json,application/json"
              onChange={(e) => e.target.files?.[0] && loadStats(e.target.files[0])}
              className="mt-2 text-xs"
            />
          </label>
          <label className="flex-1 border border-stone-700 rounded p-3 cursor-pointer hover:bg-stone-800 bg-stone-950/50">
            <div className="text-sm font-semibold">summary.csv</div>
            <div className="text-xs text-stone-400">Liste des parties (clic = rejouer)</div>
            <input
              type="file"
              accept=".csv,text/csv"
              onChange={(e) => e.target.files?.[0] && loadCsv(e.target.files[0])}
              className="mt-2 text-xs"
            />
          </label>
        </div>
      </section>

      {stats && <StatsPanel stats={stats} />}

      {rows.length > 0 && (
        <section>
          <div className="flex items-center justify-between mb-2">
            <h2 className="text-sm uppercase tracking-wider text-stone-400">
              Parties ({filtered.length}/{rows.length})
            </h2>
            <div className="flex gap-2 text-xs">
              <select
                value={resultFilter}
                onChange={(e) =>
                  setResultFilter(e.target.value as 'all' | 'victory' | 'defeat')
                }
                className="bg-stone-800 border border-stone-700 rounded px-2 py-1"
              >
                <option value="all">Tous</option>
                <option value="victory">Victoires</option>
                <option value="defeat">Défaites</option>
              </select>
              <select
                value={sortKey}
                onChange={(e) =>
                  setSortKey(e.target.value as 'seed' | 'turns' | 'boss' | 'result')
                }
                className="bg-stone-800 border border-stone-700 rounded px-2 py-1"
              >
                <option value="seed">Seed</option>
                <option value="turns">Turns (desc)</option>
                <option value="boss">Boss</option>
                <option value="result">Result</option>
              </select>
            </div>
          </div>
          <div className="border border-stone-700 rounded bg-stone-950/50 overflow-auto max-h-[60vh]">
            <table className="w-full text-xs font-mono">
              <thead className="bg-stone-900 sticky top-0">
                <tr>
                  <th className="px-2 py-1 text-left">Seed</th>
                  <th className="px-2 py-1 text-left">Boss</th>
                  <th className="px-2 py-1 text-left">Héros</th>
                  <th className="px-2 py-1 text-left">Résultat</th>
                  <th className="px-2 py-1 text-right">Tours</th>
                  <th className="px-2 py-1 text-right">Boss HP</th>
                  <th className="px-2 py-1 text-right">Events</th>
                  <th className="px-2 py-1"></th>
                </tr>
              </thead>
              <tbody>
                {sorted.slice(0, 500).map((r, i) => (
                  <tr key={i} className="border-t border-stone-800 hover:bg-stone-900">
                    <td className="px-2 py-1">{r.seed}</td>
                    <td className="px-2 py-1">{r.boss}</td>
                    <td className="px-2 py-1 text-stone-400">{r.heroes.join(', ')}</td>
                    <td
                      className={`px-2 py-1 ${
                        r.result === 'victory' ? 'text-emerald-400' : 'text-red-400'
                      }`}
                    >
                      {r.result}
                    </td>
                    <td
                      className="px-2 py-1 text-right"
                      title={`~${((r.turns * 30) / 60).toFixed(1)} min (30 s/tour)`}
                    >
                      {r.turns}
                    </td>
                    <td className="px-2 py-1 text-right">{r.bossHpRemaining}</td>
                    <td className="px-2 py-1 text-right">{r.events}</td>
                    <td className="px-2 py-1">
                      <button
                        onClick={() => replayFromRow(r)}
                        className="px-2 py-0.5 bg-sky-700 hover:bg-sky-600 rounded text-xs"
                      >
                        Rejouer
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {sorted.length > 500 && (
              <div className="p-2 text-xs text-stone-500 text-center border-t border-stone-800">
                Affichage limité aux 500 premières lignes ({sorted.length} au total).
              </div>
            )}
          </div>
        </section>
      )}
    </div>
  );
}

function StatsPanel({ stats }: { stats: Stats }) {
  return (
    <section className="space-y-3">
      <h2 className="text-sm uppercase tracking-wider text-stone-400">Agrégats</h2>
      <div className="grid grid-cols-4 gap-3">
        <Stat label="Runs" value={stats.runs} />
        <Stat
          label="Winrate"
          value={`${(stats.winrate * 100).toFixed(1)}%`}
          accent={stats.winrate >= 0.5 ? 'emerald' : 'red'}
        />
        <Stat label="Tours moyens" value={stats.meanTurns.toFixed(1)} />
        <Stat
          label="Tours vic / def"
          value={`${stats.meanTurnsVictory?.toFixed(1) ?? '—'} / ${stats.meanTurnsDefeat?.toFixed(1) ?? '—'}`}
        />
      </div>
      <div className="grid grid-cols-2 gap-4">
        <Panel title="Par boss">
          <table className="text-xs w-full font-mono">
            <thead>
              <tr className="text-stone-400">
                <th className="text-left">Boss</th>
                <th className="text-right">W</th>
                <th className="text-right">D</th>
                <th className="text-right">%</th>
              </tr>
            </thead>
            <tbody>
              {Object.entries(stats.byBoss)
                .sort((a, b) => b[1].winrate - a[1].winrate)
                .map(([b, v]) => (
                  <tr key={b}>
                    <td>{b}</td>
                    <td className="text-right">{v.wins}</td>
                    <td className="text-right">{v.defeats}</td>
                    <td
                      className={`text-right ${
                        v.winrate >= 0.5 ? 'text-emerald-400' : 'text-red-400'
                      }`}
                    >
                      {(v.winrate * 100).toFixed(1)}%
                    </td>
                  </tr>
                ))}
            </tbody>
          </table>
        </Panel>
        <Panel title="Par héros">
          <table className="text-xs w-full font-mono">
            <thead>
              <tr className="text-stone-400">
                <th className="text-left">Héros</th>
                <th className="text-right">Parties</th>
                <th className="text-right">Morts</th>
                <th className="text-right">%</th>
              </tr>
            </thead>
            <tbody>
              {Object.entries(stats.byHero)
                .sort((a, b) => a[1].deathRate - b[1].deathRate)
                .map(([h, v]) => (
                  <tr key={h}>
                    <td>{h}</td>
                    <td className="text-right">{v.games}</td>
                    <td className="text-right">{v.deaths}</td>
                    <td className="text-right">{(v.deathRate * 100).toFixed(1)}%</td>
                  </tr>
                ))}
            </tbody>
          </table>
        </Panel>
      </div>
      <Panel title="Cartes les plus jouées">
        <table className="text-xs w-full font-mono">
          <thead>
            <tr className="text-stone-400">
              <th className="text-left">Card</th>
              <th className="text-right">Count</th>
            </tr>
          </thead>
          <tbody>
            {stats.topPlayedCards.slice(0, 15).map(([c, n]) => (
              <tr key={c}>
                <td>{c}</td>
                <td className="text-right">{n}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </Panel>
    </section>
  );
}

function Stat({ label, value, accent }: { label: string; value: string | number; accent?: 'emerald' | 'red' }) {
  const color =
    accent === 'emerald'
      ? 'text-emerald-400'
      : accent === 'red'
        ? 'text-red-400'
        : 'text-stone-100';
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
