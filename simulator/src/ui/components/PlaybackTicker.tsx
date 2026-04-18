import { useEffect } from 'react';
import { useStore } from '../store.js';
import type { GameEvent } from '../../engine/events.js';

/** Weight in [0, 1] for each event kind — multiplied by `base` ms. */
function eventWeight(ev: GameEvent): number {
  switch (ev.kind) {
    case 'ACTION_PLAY_ACTION':
    case 'ACTION_PLAY_OBJECT':
    case 'OBJECT_USED':
    case 'ACTION_EXCHANGE':
    case 'DRAW_MENACE':
    case 'CHOICE_MADE':
    case 'CAPACITE_USED':
    case 'HERO_DEATH':
    case 'BOSS_DEFEATED':
    case 'RESOLVE_DESTIN':
      return 1.0;
    case 'SUMMON_MONSTER':
    case 'MONSTER_MOVED':
    case 'ELIMINATE_MONSTER':
    case 'BOSS_ACTIF_TRIGGERED':
      return 0.5;
    case 'ATTACK':
    case 'DAMAGE':
    case 'ACTION_DRAW':
      return 0.25;
    case 'TURN_START':
    case 'TURN_END':
      return 0.2;
    default:
      return 0.06;
  }
}

/**
 * Progressive event reveal. When animations are on, advances the store's
 * `visibleEventCount` one event at a time with a delay derived from the next
 * event's importance. Mounted once in Game.tsx.
 */
export function PlaybackTicker() {
  const enabled = useStore((s) => s.animationsEnabled);
  const state = useStore((s) => s.state);
  const visible = useStore((s) => s.visibleEventCount);
  const setVisible = useStore((s) => s.setVisibleEventCount);
  const base = useStore((s) => s.animSpeedMs);

  useEffect(() => {
    if (!state) return;
    if (!enabled) {
      if (visible < state.events.length) setVisible(state.events.length);
      return;
    }
    if (visible >= state.events.length) return;
    const next = state.events[visible];
    if (!next) return;
    const delay = Math.max(30, Math.round(base * eventWeight(next)));
    const timer = setTimeout(() => {
      setVisible(Math.min(useStore.getState().state?.events.length ?? 0, visible + 1));
    }, delay);
    return () => clearTimeout(timer);
  }, [enabled, state, visible, setVisible, base]);

  return null;
}
