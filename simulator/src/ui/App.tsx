import { useEffect, useState } from 'react';
import { useStore } from './store.js';
import { Setup } from './Setup.js';
import { Game } from './Game.js';
import { Dashboard } from './Dashboard.js';
import { Batch } from './Batch.js';
import { CardInspector } from './components/CardInspector.js';

export function App() {
  const loading = useStore((s) => s.loading);
  const error = useStore((s) => s.error);
  const design = useStore((s) => s.design);
  const state = useStore((s) => s.state);
  const view = useStore((s) => s.view);
  const setView = useStore((s) => s.setView);
  const load = useStore((s) => s.load);
  const [reloading, setReloading] = useState(false);
  const reloadJsons = async () => {
    setReloading(true);
    try {
      await load();
    } finally {
      setReloading(false);
    }
  };

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

  const body =
    view === 'dashboard'
      ? <Dashboard />
      : view === 'batch'
        ? <Batch />
        : view === 'game' && state
          ? <Game />
          : <Setup />;

  return (
    <div className="min-h-screen">
      <header className="px-4 py-2 border-b border-stone-700 flex justify-between items-center">
        <div className="flex items-center gap-4">
          <h1 className="text-lg font-semibold">Raid Party — Simulateur</h1>
          <nav className="flex gap-1 text-xs">
            <TabBtn active={view === 'setup'} onClick={() => setView('setup')}>Setup</TabBtn>
            <TabBtn
              active={view === 'game'}
              onClick={() => state && setView('game')}
              disabled={!state}
            >
              Partie
            </TabBtn>
            <TabBtn active={view === 'batch'} onClick={() => setView('batch')}>Batch</TabBtn>
            <TabBtn active={view === 'dashboard'} onClick={() => setView('dashboard')}>Dashboard</TabBtn>
          </nav>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-xs text-stone-400">
            {state ? `Tour ${state.turn} / seed ${state.seed} / ${state.result}` : 'Setup'}
          </span>
          <button
            onClick={reloadJsons}
            disabled={reloading}
            title="Re-fetch les JSON depuis le disque (boss, cartes, menaces, destins, effects). Les modifs Unity sont lues à chaud en dev."
            className="px-3 py-1 text-xs bg-stone-800 hover:bg-stone-700 border border-stone-700 rounded-md transition-colors disabled:opacity-50"
          >
            {reloading ? '⏳ Chargement…' : '↻ Recharger JSONs'}
          </button>
        </div>
      </header>
      {body}
      <CardInspector />
    </div>
  );
}

function TabBtn({
  active,
  disabled,
  onClick,
  children,
}: {
  active: boolean;
  disabled?: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`px-2 py-1 rounded ${
        active
          ? 'bg-stone-700 text-stone-100'
          : 'text-stone-400 hover:bg-stone-800'
      } disabled:opacity-40 disabled:cursor-not-allowed`}
    >
      {children}
    </button>
  );
}
