import { useEffect, useRef } from 'react';
import { useStore } from '../store.js';

/**
 * Auto-enchaîne les tours tant que `autoPlay` est vrai.
 *
 * Règles :
 * - N'avance que si la partie est en cours, pas en mode manuel, et qu'aucune
 *   décision humaine n'est en attente.
 * - Attend que PlaybackTicker ait révélé tous les events (animations) avant
 *   de déclencher le tour suivant, pour éviter d'écraser l'anim en cours.
 * - Insère une pause inter-tour dérivée d'animSpeedMs (0.6× la durée de base)
 *   ou 250 ms si les animations sont désactivées.
 */
export function AutoPlayer() {
  const autoPlay = useStore((s) => s.autoPlay);
  const setAutoPlay = useStore((s) => s.setAutoPlay);
  const manualMode = useStore((s) => s.manualMode);
  const state = useStore((s) => s.state);
  const visible = useStore((s) => s.visibleEventCount);
  const animsEnabled = useStore((s) => s.animationsEnabled);
  const base = useStore((s) => s.animSpeedMs);
  const nextTurn = useStore((s) => s.nextTurn);
  const pendingDecision = useStore((s) => s.pendingDecision);

  const busyRef = useRef(false);

  // Arrêt automatique quand la partie se termine ou qu'une décision humaine
  // intervient (manualMode toggled en cours).
  useEffect(() => {
    if (!autoPlay) return;
    if (!state || state.result !== 'running') {
      setAutoPlay(false);
      return;
    }
    if (manualMode) {
      setAutoPlay(false);
      return;
    }
  }, [autoPlay, state, state?.result, manualMode, setAutoPlay]);

  useEffect(() => {
    if (!autoPlay || manualMode || !state) return;
    if (state.result !== 'running') return;
    if (pendingDecision) return;
    // Animations en cours : attend que tout soit visible.
    if (animsEnabled && visible < state.events.length) return;
    if (busyRef.current) return;

    const pause = animsEnabled ? Math.max(250, Math.round(base * 0.6)) : 250;
    const timer = setTimeout(async () => {
      busyRef.current = true;
      try {
        await nextTurn();
      } finally {
        busyRef.current = false;
      }
    }, pause);
    return () => clearTimeout(timer);
  }, [autoPlay, manualMode, state, visible, animsEnabled, base, nextTurn, pendingDecision]);

  return null;
}
