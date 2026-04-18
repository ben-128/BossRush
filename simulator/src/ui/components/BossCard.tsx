import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useStore, totalWoundsOf } from '../store.js';
import { useSpotlight } from '../useSpotlight.js';
import type { GameEvent } from '../../engine/events.js';

/** Extract bullet texts (lines starting after `•`) from a menace description. */
function extractBullets(description: string): string[] {
  return description
    .split(/•\s*/)
    .slice(1)
    .map((b) => b.split('\n')[0]!.trim())
    .filter((b) => b.length > 0);
}

export function BossCard() {
  const state = useStore((s) => s.state)!;
  const design = useStore((s) => s.design)!;
  const inspect = useStore((s) => s.inspect);
  const boss = design.boss.find((b) => b.id === state.boss.bossId);
  const visibleCount = useStore((s) => s.visibleEventCount);
  const animSpeedMs = useStore((s) => s.animSpeedMs);
  // Roll back any DAMAGE events targeting the boss that haven't been revealed
  // yet, so the HP bar shrinks in sync with the playback.
  const displayedBossWounds = useMemo(() => {
    const w = [...state.boss.wounds];
    for (let i = state.events.length - 1; i >= visibleCount; i--) {
      const ev = state.events[i]!;
      if (ev.kind === 'DAMAGE' && ev.targetKind === 'boss') {
        const idx = w.findIndex((x) => x.woundId === ev.woundId);
        if (idx >= 0) w.splice(idx, 1);
      }
    }
    return w;
  }, [state.boss.wounds, state.events, visibleCount]);
  const dmg = totalWoundsOf(displayedBossWounds);
  const hp = state.boss.vieMax - dmg;
  const pct = Math.max(0, (hp / state.boss.vieMax) * 100);
  const low = pct <= 33;

  // Flash on damage taken.
  const prevDmg = useRef(dmg);
  const [flash, setFlash] = useState(false);
  useEffect(() => {
    if (dmg > prevDmg.current) {
      setFlash(true);
      const t = setTimeout(() => setFlash(false), 600);
      return () => clearTimeout(t);
    }
    prevDmg.current = dmg;
  }, [dmg]);

  // Flash the "⚡ Actif" row when the boss actif is triggered.
  const [actifFlash, setActifFlash] = useState(false);
  const lastActifT = useRef(0);
  useEffect(() => {
    if (visibleCount === 0) {
      lastActifT.current = 0;
      return;
    }
    const latest = state.events[visibleCount - 1];
    if (!latest || latest.t <= lastActifT.current) return;
    lastActifT.current = latest.t;
    if (latest.kind === 'BOSS_ACTIF_TRIGGERED') {
      setActifFlash(true);
      const t = setTimeout(() => setActifFlash(false), animSpeedMs);
      return () => clearTimeout(t);
    }
  }, [visibleCount, state, animSpeedMs]);

  // Spotlight: boss-centric events.
  type BossEvent = Extract<
    GameEvent,
    { kind: 'DRAW_MENACE' | 'RESOLVE_MENACE' | 'CHOICE_MADE' | 'BOSS_ACTIF_TRIGGERED' | 'RESOLVE_DESTIN' }
  >;
  const predicate = useCallback(
    (ev: GameEvent): ev is BossEvent =>
      ev.kind === 'DRAW_MENACE' ||
      ev.kind === 'BOSS_ACTIF_TRIGGERED' ||
      ev.kind === 'RESOLVE_DESTIN' ||
      (ev.kind === 'CHOICE_MADE' && design.menaces.some((m) => m.id === ev.sourceCardId)),
    [design],
  );
  const spotlight = useSpotlight<BossEvent>(predicate);
  const spotlightContent = (() => {
    if (!spotlight || !design) return null;
    if (spotlight.kind === 'DRAW_MENACE') {
      const m = design.menaces.find((x) => x.id === spotlight.card);
      return { kicker: 'Menace', title: m?.nom ?? spotlight.card, body: m?.description ?? '' };
    }
    if (spotlight.kind === 'BOSS_ACTIF_TRIGGERED') {
      const b = design.boss.find((x) => x.id === spotlight.bossId);
      return { kicker: '⚡ Actif boss', title: b?.nom ?? spotlight.bossId, body: b?.stats.actif ?? '' };
    }
    if (spotlight.kind === 'RESOLVE_DESTIN') {
      const d = design.destins.find((x) => x.id === spotlight.card);
      return {
        kicker: '☲ Destin',
        title: d?.titre ?? spotlight.card,
        body: d?.effet ?? '',
      };
    }
    if (spotlight.kind === 'CHOICE_MADE') {
      const m = design.menaces.find((x) => x.id === spotlight.sourceCardId);
      const title = m?.nom ?? spotlight.sourceCardId;
      // Pull all bullets from the menace description and highlight the one
      // matching the chosen label.
      const bullets = extractBullets(m?.description ?? '');
      const chosen = bullets.find((b) =>
        b.toLowerCase().startsWith(spotlight.label.replace(/_/g, ' ').toLowerCase()),
      );
      return {
        kicker: `Choix · seat ${spotlight.seat}`,
        title,
        bullets,
        chosen: chosen ?? null,
        variant: 'choice' as const,
      };
    }
    return null;
  })();

  if (!boss) return null;

  const ended = state.result !== 'running';

  return (
    <div
      className={`relative border-2 rounded-xl p-5 transition-colors ${
        ended
          ? 'border-stone-700 bg-stone-950/80'
          : low
            ? 'border-red-600 bg-gradient-to-br from-stone-950 to-red-950/40 shadow-[0_0_30px_rgba(239,68,68,0.15)]'
            : 'border-red-900/70 bg-gradient-to-br from-stone-950 to-stone-900'
      } ${flash ? 'animate-boss-flash' : ''}`}
    >
      <div className="flex items-baseline justify-between mb-3">
        <h2 className="text-2xl font-bold text-red-200 tracking-wide drop-shadow">
          <button
            onClick={() => inspect({ kind: 'boss', id: boss.id })}
            className="hover:text-red-100 transition-colors"
            title="Cliquer pour voir les détails"
          >
            {boss.nom}
          </button>
          <span className="text-xs uppercase text-stone-400 font-normal ml-3 tracking-wider">
            {boss.difficulte}
          </span>
        </h2>
        <div className="text-right">
          <div className="font-mono text-lg text-stone-100">
            <span className={low && !ended ? 'text-red-300' : ''}>{hp}</span>
            <span className="text-stone-500"> / {state.boss.vieMax}</span>
          </div>
          <div className="text-[10px] uppercase tracking-wider text-stone-500">PV</div>
        </div>
      </div>

      <div className="h-3 bg-stone-800 rounded-full overflow-hidden mb-3 shadow-inner">
        <div
          className={`h-full transition-[width] duration-700 ease-out ${
            low ? 'bg-gradient-to-r from-red-700 to-red-500' : 'bg-gradient-to-r from-red-800 to-red-600'
          }`}
          style={{ width: `${pct}%` }}
        />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-[auto_1fr] gap-x-4 gap-y-1.5 text-xs">
        <span className="text-stone-400 uppercase tracking-wider">Séquence</span>
        <span className="font-mono text-stone-200">{boss.stats.sequence.join(' → ')}</span>
        <span className="text-stone-400 uppercase tracking-wider">Passif</span>
        <span className="text-stone-200">{boss.stats.passif}</span>
        <span
          className={`text-stone-400 uppercase tracking-wider ${actifFlash ? 'animate-row-highlight' : ''}`}
          style={actifFlash ? { animationDuration: `${animSpeedMs}ms` } : undefined}
        >
          ⚡ Actif
        </span>
        <span
          className={`text-stone-200 ${actifFlash ? 'animate-row-highlight' : ''}`}
          style={actifFlash ? { animationDuration: `${animSpeedMs}ms` } : undefined}
        >
          {boss.stats.actif}
        </span>
      </div>

      {spotlightContent && (
        <div
          key={`${spotlight!.t}`}
          style={{ animationDuration: `${animSpeedMs}ms` }}
          className={`mt-4 rounded-xl border-2 shadow-lg animate-menace-reveal px-5 py-4 ${
            spotlightContent.variant === 'choice'
              ? 'border-emerald-500/80 bg-gradient-to-br from-stone-950/95 to-emerald-950/70 shadow-[0_0_30px_rgba(16,185,129,0.25)]'
              : 'border-amber-600/70 bg-gradient-to-br from-stone-950/95 to-amber-950/80'
          }`}
        >
          <div className="flex items-baseline justify-between gap-3 mb-2">
            <span
              className={`text-[10px] uppercase tracking-[0.25em] font-semibold ${
                spotlightContent.variant === 'choice' ? 'text-emerald-300' : 'text-amber-400'
              }`}
            >
              {spotlightContent.kicker}
            </span>
            <span
              className={`text-lg font-bold leading-tight ${
                spotlightContent.variant === 'choice' ? 'text-emerald-100' : 'text-amber-100'
              }`}
            >
              {spotlightContent.title}
            </span>
          </div>
          {spotlightContent.variant === 'choice' && 'bullets' in spotlightContent ? (
            <div className="space-y-1.5">
              {spotlightContent.bullets.map((b, i) => {
                const isChosen = b === spotlightContent.chosen;
                return (
                  <div
                    key={i}
                    className={`text-sm leading-snug px-2 py-1 rounded ${
                      isChosen
                        ? 'bg-emerald-600/30 border border-emerald-400/80 text-emerald-50 font-medium shadow-[0_0_12px_rgba(16,185,129,0.25)]'
                        : 'text-stone-500 line-through decoration-stone-600 opacity-70'
                    }`}
                  >
                    {isChosen ? '✓ ' : '✗ '}
                    {b}
                  </div>
                );
              })}
            </div>
          ) : (
            'body' in spotlightContent &&
            spotlightContent.body && (
              <div className="text-sm whitespace-pre-line leading-relaxed text-amber-200/90">
                {spotlightContent.body}
              </div>
            )
          )}
        </div>
      )}

      {ended && (
        <div
          className={`mt-4 text-center py-3 rounded-lg font-bold text-lg tracking-wide animate-slide-in-top ${
            state.result === 'victory'
              ? 'bg-gradient-to-r from-emerald-800 to-emerald-700 text-emerald-50 shadow-lg'
              : 'bg-gradient-to-r from-red-900 to-red-800 text-red-50 shadow-lg'
          }`}
        >
          {state.result === 'victory' ? '🏆 VICTOIRE' : '✝ DÉFAITE'} · {state.turn} tours (~
          {((state.turn * 30) / 60).toFixed(1)} min)
        </div>
      )}
    </div>
  );
}
