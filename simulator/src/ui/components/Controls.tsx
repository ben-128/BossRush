import { useStore } from '../store.js';

export function Controls() {
  const state = useStore((s) => s.state)!;
  const nextTurn = useStore((s) => s.nextTurn);
  const runToEnd = useStore((s) => s.runToEnd);
  const reset = useStore((s) => s.reset);
  const ended = state.result !== 'running';

  return (
    <div className="flex flex-wrap gap-2 items-center border-t border-stone-700 pt-3 mt-auto">
      <button
        onClick={nextTurn}
        disabled={ended}
        className="px-4 py-2 bg-sky-700 hover:bg-sky-600 rounded disabled:opacity-40"
      >
        Tour suivant →
      </button>
      <button
        onClick={runToEnd}
        disabled={ended}
        className="px-4 py-2 bg-indigo-700 hover:bg-indigo-600 rounded disabled:opacity-40"
      >
        Simuler jusqu'à la fin
      </button>
      <button
        onClick={reset}
        className="px-4 py-2 bg-stone-700 hover:bg-stone-600 rounded"
      >
        Nouvelle partie
      </button>
      <span className="text-xs text-stone-400 ml-auto">
        Tour {state.turn} · Seat actif {state.activeSeat} · {state.events.length} events
      </span>
    </div>
  );
}
