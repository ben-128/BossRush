import { useEffect } from 'react';
import { useStore } from './store.js';
import { Setup } from './Setup.js';
import { Game } from './Game.js';

export function App() {
  const loading = useStore((s) => s.loading);
  const error = useStore((s) => s.error);
  const design = useStore((s) => s.design);
  const state = useStore((s) => s.state);
  const load = useStore((s) => s.load);

  useEffect(() => {
    if (!design && !loading && !error) void load();
  }, [design, loading, error, load]);

  if (error) {
    return (
      <div className="p-8 text-red-300">
        <h1 className="text-xl font-bold mb-2">Erreur au chargement</h1>
        <pre className="whitespace-pre-wrap text-sm">{error}</pre>
      </div>
    );
  }

  if (loading || !design) {
    return <div className="p-8 text-stone-400">Chargement des données…</div>;
  }

  return (
    <div className="min-h-screen">
      <header className="px-4 py-2 border-b border-stone-700 flex justify-between items-center">
        <h1 className="text-lg font-semibold">Raid Party — Simulateur</h1>
        <span className="text-xs text-stone-400">
          {state ? `Tour ${state.turn} / seed ${state.seed}` : 'Setup'}
        </span>
      </header>
      {state ? <Game /> : <Setup />}
    </div>
  );
}
