import { useStore } from '../store.js';

export function Controls() {
  const state = useStore((s) => s.state)!;
  const nextTurn = useStore((s) => s.nextTurn);
  const runToEnd = useStore((s) => s.runToEnd);
  const reset = useStore((s) => s.reset);
  const animationsEnabled = useStore((s) => s.animationsEnabled);
  const setAnimationsEnabled = useStore((s) => s.setAnimationsEnabled);
  const animSpeedMs = useStore((s) => s.animSpeedMs);
  const setAnimSpeedMs = useStore((s) => s.setAnimSpeedMs);
  const ended = state.result !== 'running';

  return (
    <div className="flex flex-wrap gap-3 items-center border-t border-stone-700 pt-4 mt-auto">
      <button
        onClick={nextTurn}
        disabled={ended}
        className="px-5 py-2.5 bg-gradient-to-b from-sky-600 to-sky-700 hover:from-sky-500 hover:to-sky-600 rounded-lg disabled:opacity-40 disabled:cursor-not-allowed shadow-md transition-all font-medium"
      >
        Tour suivant →
      </button>
      <button
        onClick={runToEnd}
        disabled={ended}
        className="px-5 py-2.5 bg-gradient-to-b from-indigo-600 to-indigo-700 hover:from-indigo-500 hover:to-indigo-600 rounded-lg disabled:opacity-40 disabled:cursor-not-allowed shadow-md transition-all font-medium"
      >
        Simuler jusqu'à la fin
      </button>
      <button
        onClick={reset}
        className="px-5 py-2.5 bg-stone-700 hover:bg-stone-600 rounded-lg shadow-md transition-all"
      >
        Nouvelle partie
      </button>
      <label
        className="flex items-center gap-2 text-xs text-stone-300 select-none cursor-pointer px-3 py-1.5 rounded-lg border border-stone-700 hover:bg-stone-800/60 transition-colors"
        title="Active les animations et la mise en scène des événements"
      >
        <input
          type="checkbox"
          checked={animationsEnabled}
          onChange={(e) => setAnimationsEnabled(e.target.checked)}
          className="accent-emerald-500"
        />
        <span>Animations</span>
      </label>
      <label
        className={`flex items-center gap-2 text-xs text-stone-300 px-3 py-1.5 rounded-lg border border-stone-700 ${
          !animationsEnabled ? 'opacity-40' : ''
        }`}
        title="Durée d'un event clé (play/menace/choice…). Les events plus légers se calent proportionnellement."
      >
        <span className="select-none">Durée</span>
        <input
          type="range"
          min={300}
          max={10000}
          step={100}
          value={animSpeedMs}
          disabled={!animationsEnabled}
          onChange={(e) => setAnimSpeedMs(parseInt(e.target.value, 10))}
          className="accent-emerald-500"
        />
        <span className="font-mono w-14 text-right">{(animSpeedMs / 1000).toFixed(1)}s</span>
      </label>
      <span className="text-xs text-stone-400 ml-auto font-mono">
        Tour {state.turn} <span className="text-stone-600">(~{((state.turn * 30) / 60).toFixed(1)} min)</span>
        <span className="text-stone-600"> · </span>
        Seat actif {state.activeSeat}
        <span className="text-stone-600"> · </span>
        {state.events.length} events
      </span>
    </div>
  );
}
