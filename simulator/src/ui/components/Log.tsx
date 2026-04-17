import { useState, useRef, useEffect } from 'react';
import { useStore, describeEvent } from '../store.js';
import type { GameEvent } from '../../engine/events.js';

const KIND_COLORS: Record<string, string> = {
  SETUP: 'text-stone-400',
  TURN_START: 'text-yellow-400 font-semibold',
  TURN_END: 'text-stone-500',
  PHASE: 'text-stone-500',
  ATTACK: 'text-orange-300',
  DAMAGE: 'text-red-300',
  ELIMINATE_MONSTER: 'text-red-400 font-semibold',
  HERO_DEATH: 'text-red-500 font-bold',
  BOSS_DEFEATED: 'text-emerald-400 font-bold',
  GAME_END: 'text-emerald-300 font-bold',
  WARN: 'text-yellow-500',
  NOT_IMPLEMENTED: 'text-stone-600',
  ACTION_DRAW: 'text-sky-300',
  ACTION_PLAY_ACTION: 'text-emerald-300',
  SUMMON_MONSTER: 'text-purple-300',
  DRAW_MENACE: 'text-amber-300',
  RESOLVE_MENACE: 'text-amber-200',
  BOSS_SEQ_ICON: 'text-amber-500',
  ATTACK_ORDER: 'text-red-400',
};

const ALL_FILTERS = ['combat', 'actions', 'boss', 'draws', 'debug'] as const;
type FilterKind = (typeof ALL_FILTERS)[number];

function eventCategory(ev: GameEvent): FilterKind | 'other' {
  switch (ev.kind) {
    case 'ATTACK':
    case 'DAMAGE':
    case 'ELIMINATE_MONSTER':
    case 'HERO_DEATH':
    case 'BOSS_DEFEATED':
    case 'ATTACK_ORDER':
      return 'combat';
    case 'ACTION_DRAW':
    case 'ACTION_PLAY_ACTION':
    case 'ACTION_PLAY_OBJECT':
    case 'ACTION_EXCHANGE':
    case 'ACTION_NONE':
      return 'actions';
    case 'BOSS_SEQ_ICON':
    case 'DRAW_MENACE':
    case 'RESOLVE_MENACE':
    case 'SUMMON_MONSTER':
    case 'BOSS_ACTIF_TRIGGERED':
      return 'boss';
    case 'DRAW_CARD':
    case 'DISCARD_CARD':
    case 'PILE_RESHUFFLE':
    case 'SHUFFLE_PILE':
    case 'INITIAL_HAND':
      return 'draws';
    case 'WARN':
    case 'NOT_IMPLEMENTED':
    case 'PHASE':
    case 'SKIP_TURN':
      return 'debug';
    default:
      return 'other';
  }
}

export function Log() {
  const state = useStore((s) => s.state)!;
  const [filters, setFilters] = useState<Set<FilterKind>>(
    new Set(ALL_FILTERS.filter((f) => f !== 'debug' && f !== 'draws')),
  );
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
  }, [state.events.length]);

  const visible = state.events.filter((ev) => {
    const cat = eventCategory(ev);
    if (cat === 'other') return true;
    return filters.has(cat as FilterKind);
  });

  const toggle = (f: FilterKind) =>
    setFilters((prev) => {
      const next = new Set(prev);
      if (next.has(f)) next.delete(f);
      else next.add(f);
      return next;
    });

  return (
    <div className="border border-stone-700 rounded-lg bg-stone-950/70 flex flex-col overflow-hidden">
      <div className="px-3 py-2 border-b border-stone-800 flex items-center justify-between">
        <span className="text-sm font-semibold">Log ({visible.length}/{state.events.length})</span>
        <div className="flex space-x-1">
          {ALL_FILTERS.map((f) => (
            <button
              key={f}
              onClick={() => toggle(f)}
              className={`px-2 py-0.5 text-xs rounded border ${
                filters.has(f)
                  ? 'bg-stone-700 border-stone-600'
                  : 'bg-stone-900 border-stone-800 text-stone-500'
              }`}
            >
              {f}
            </button>
          ))}
        </div>
      </div>
      <div ref={scrollRef} className="flex-1 overflow-auto font-mono text-xs p-2 space-y-0.5">
        {visible.map((ev) => (
          <div key={ev.t} className={`${KIND_COLORS[ev.kind] ?? 'text-stone-300'}`}>
            <span className="text-stone-600 mr-1">{ev.t.toString().padStart(4)}</span>
            {describeEvent(ev, state)}
          </div>
        ))}
      </div>
    </div>
  );
}
