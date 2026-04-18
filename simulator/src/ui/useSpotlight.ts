import { useEffect, useRef, useState } from 'react';
import { useStore } from './store.js';
import type { GameEvent } from '../engine/events.js';

/**
 * Return the latest newly-revealed event matching `predicate`. The returned
 * value lives until the UI moves to the next event worth showing, at which
 * point it flips back to `null`. Used by panels to trigger CSS spotlight
 * animations exactly when a relevant event is revealed by PlaybackTicker.
 */
export function useSpotlight<E extends GameEvent>(
  predicate: (ev: GameEvent) => ev is E,
): E | null {
  const state = useStore((s) => s.state);
  const visible = useStore((s) => s.visibleEventCount);
  const enabled = useStore((s) => s.animationsEnabled);
  const base = useStore((s) => s.animSpeedMs);
  const lastChecked = useRef(0);
  const [current, setCurrent] = useState<E | null>(null);

  // Effect 1: detect and set `current`. Does not manage the expiry timer,
  // so non-matching reveals don't accidentally cancel the pending clear.
  useEffect(() => {
    if (!state) {
      lastChecked.current = 0;
      setCurrent(null);
      return;
    }
    if (!enabled) {
      lastChecked.current = visible;
      setCurrent(null);
      return;
    }
    if (visible < lastChecked.current) {
      lastChecked.current = 0;
      setCurrent(null);
    }
    if (visible === 0) return;
    const latest = state.events[visible - 1];
    if (!latest || latest.t <= lastChecked.current) return;
    lastChecked.current = latest.t;
    if (predicate(latest)) setCurrent(latest);
  }, [state, visible, enabled, predicate]);

  // Effect 2: auto-clear after `base` ms, only when `current` changes.
  useEffect(() => {
    if (current === null) return;
    const timer = setTimeout(() => setCurrent(null), base);
    return () => clearTimeout(timer);
  }, [current, base]);

  return current;
}
