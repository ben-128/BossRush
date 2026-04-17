import { useStore, totalWoundsOf } from '../store.js';

export function BossCard() {
  const state = useStore((s) => s.state)!;
  const design = useStore((s) => s.design)!;
  const inspect = useStore((s) => s.inspect);
  const boss = design.boss.find((b) => b.id === state.boss.bossId);
  const dmg = totalWoundsOf(state.boss.wounds);
  const hp = state.boss.vieMax - dmg;
  const pct = Math.max(0, (hp / state.boss.vieMax) * 100);

  if (!boss) return null;

  return (
    <div className="border-2 border-boss/80 rounded-lg p-4 bg-stone-950/50">
      <div className="flex items-baseline justify-between mb-2">
        <h2 className="text-xl font-bold text-red-200">
          <button
            onClick={() => inspect({ kind: 'boss', id: boss.id })}
            className="hover:text-red-100 transition-colors"
            title="Cliquer pour voir les détails"
          >
            {boss.nom}
          </button>{' '}
          <span className="text-xs uppercase text-stone-400 font-normal">
            {boss.difficulte}
          </span>
        </h2>
        <div className="text-sm">
          <span className="font-mono">{hp}</span>
          <span className="text-stone-500"> / {state.boss.vieMax} PV</span>
        </div>
      </div>
      <div className="h-2 bg-stone-800 rounded overflow-hidden mb-2">
        <div
          className="h-full bg-red-600 transition-all"
          style={{ width: `${pct}%` }}
        />
      </div>
      <div className="text-xs space-y-1">
        <div>
          <span className="text-stone-400">Séquence:</span>{' '}
          <span className="font-mono">{boss.stats.sequence.join(' → ')}</span>
        </div>
        <div>
          <span className="text-stone-400">Passif:</span> {boss.stats.passif}
        </div>
        <div>
          <span className="text-stone-400">⚡ Actif:</span> {boss.stats.actif}
        </div>
      </div>
      {state.result !== 'running' && (
        <div
          className={`mt-3 text-center py-2 rounded font-bold ${
            state.result === 'victory'
              ? 'bg-emerald-800 text-emerald-100'
              : 'bg-red-900 text-red-100'
          }`}
        >
          {state.result === 'victory' ? '🏆 VICTOIRE' : '✝ DÉFAITE'} — {state.turn} tours
        </div>
      )}
    </div>
  );
}
