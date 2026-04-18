import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useStore, totalWoundsOf } from '../store.js';
import { chasseName, monstreName } from '../naming.js';
import { useSpotlight } from '../useSpotlight.js';
import { displayedHero } from '../displayedHero.js';
import type { GameEvent } from '../../engine/events.js';

interface Props {
  seat: number;
}

const COMPETENCE_COLOR: Record<
  string,
  {
    text: string;
    handBg: string;
    handRing: string;
    shadow: string;
    border: string;
    ringSoft: string;
  }
> = {
  magie: {
    text: 'text-orange-300',
    handBg: 'bg-orange-900/40',
    handRing: 'hover:ring-orange-400',
    shadow: 'shadow-[0_0_8px_rgba(251,146,60,0.5)]',
    border: 'border-orange-700/60',
    ringSoft: 'shadow-[0_0_22px_rgba(251,146,60,0.2)]',
  },
  soin: {
    text: 'text-emerald-300',
    handBg: 'bg-emerald-900/40',
    handRing: 'hover:ring-emerald-400',
    shadow: 'shadow-[0_0_8px_rgba(52,211,153,0.5)]',
    border: 'border-emerald-700/60',
    ringSoft: 'shadow-[0_0_22px_rgba(52,211,153,0.2)]',
  },
  armure: {
    text: 'text-slate-300',
    handBg: 'bg-slate-700/40',
    handRing: 'hover:ring-slate-300',
    shadow: 'shadow-[0_0_8px_rgba(203,213,225,0.4)]',
    border: 'border-slate-500/60',
    ringSoft: 'shadow-[0_0_22px_rgba(203,213,225,0.18)]',
  },
  distance: {
    text: 'text-sky-300',
    handBg: 'bg-sky-900/40',
    handRing: 'hover:ring-sky-400',
    shadow: 'shadow-[0_0_8px_rgba(56,189,248,0.5)]',
    border: 'border-sky-700/60',
    ringSoft: 'shadow-[0_0_22px_rgba(56,189,248,0.2)]',
  },
  diplomatie: {
    text: 'text-fuchsia-300',
    handBg: 'bg-fuchsia-900/40',
    handRing: 'hover:ring-fuchsia-400',
    shadow: 'shadow-[0_0_8px_rgba(232,121,249,0.5)]',
    border: 'border-fuchsia-700/60',
    ringSoft: 'shadow-[0_0_22px_rgba(232,121,249,0.2)]',
  },
};
const DEFAULT_COLOR = {
  text: 'text-stone-200',
  handBg: 'bg-sky-900/50',
  handRing: 'hover:ring-sky-400',
  shadow: '',
  border: 'border-stone-700',
  ringSoft: '',
};

export function HeroPanel({ seat }: Props) {
  const state = useStore((s) => s.state)!;
  const design = useStore((s) => s.design)!;
  const inspect = useStore((s) => s.inspect);
  const visibleCount = useStore((s) => s.visibleEventCount);
  const rawHero = state.heroes[seat];
  const h = useMemo(
    () => (rawHero ? displayedHero(rawHero, state.events, visibleCount, seat, design) : undefined),
    [rawHero, state.events, visibleCount, seat, design],
  );

  // Hooks must run unconditionally — declare before any early return.
  const animSpeedMs = useStore((s) => s.animSpeedMs);
  const dmg = h ? totalWoundsOf(h.wounds) : 0;
  const [shake, setShake] = useState(false);
  const [healGlow, setHealGlow] = useState(false);
  const [capacityFlash, setCapacityFlash] = useState(false);
  const [objectsFlash, setObjectsFlash] = useState(false);
  const lastRevealedT = useRef(0);

  // Drive shake / heal-glow from the event-reveal cadence (PlaybackTicker),
  // not from the instant state mutation.
  useEffect(() => {
    if (visibleCount === 0) {
      lastRevealedT.current = 0;
      return;
    }
    const latest = state.events[visibleCount - 1];
    if (!latest || latest.t <= lastRevealedT.current) return;
    lastRevealedT.current = latest.t;
    if (latest.kind === 'DAMAGE' && latest.targetKind === 'hero') {
      const hero = state.heroes.find((x) => x.heroId === latest.targetId);
      if (hero?.seatIdx === seat) {
        setShake(true);
        const t = setTimeout(() => setShake(false), 400);
        return () => clearTimeout(t);
      }
    } else if (
      latest.kind === 'HEAL_APPLIED' &&
      latest.seat === seat &&
      latest.healed > 0
    ) {
      setHealGlow(true);
      const t = setTimeout(() => setHealGlow(false), 1200);
      return () => clearTimeout(t);
    } else if (latest.kind === 'CAPACITE_USED' && latest.seat === seat) {
      setCapacityFlash(true);
      const t = setTimeout(() => setCapacityFlash(false), animSpeedMs);
      return () => clearTimeout(t);
    } else if (latest.kind === 'OBJECT_USED' && latest.seat === seat) {
      setObjectsFlash(true);
      const t = setTimeout(() => setObjectsFlash(false), animSpeedMs);
      return () => clearTimeout(t);
    }
  }, [visibleCount, state, seat, animSpeedMs]);

  if (!h) return null;
  const heroCard = design.heroes.find((x) => x.id === h.heroId);
  if (!heroCard) return null;

  const isActive = state.activeSeat === seat && state.result === 'running';
  const color = COMPETENCE_COLOR[heroCard.competences[0] ?? ''] ?? DEFAULT_COLOR;

  // Spotlight: latest play/use/capacity event for this seat.
  type SeatEvent = Extract<
    GameEvent,
    {
      kind:
        | 'ACTION_PLAY_ACTION'
        | 'ACTION_PLAY_OBJECT'
        | 'OBJECT_USED'
        | 'CAPACITE_USED'
        | 'ACTION_EXCHANGE';
    }
  >;
  const predicate = useCallback(
    (ev: GameEvent): ev is SeatEvent =>
      (ev.kind === 'ACTION_PLAY_ACTION' ||
        ev.kind === 'ACTION_PLAY_OBJECT' ||
        ev.kind === 'OBJECT_USED' ||
        ev.kind === 'CAPACITE_USED' ||
        ev.kind === 'ACTION_EXCHANGE') &&
      ev.seat === seat,
    [seat],
  );
  const spotlight = useSpotlight<SeatEvent>(predicate);
  const spotlightLabel = (() => {
    if (!spotlight) return null;
    const chasseOf = (id: string) => design.cartesChasse.find((c) => c.id === id);
    // Sum damage events that fired as part of this card's resolution (same
    // sourceCardId, within the next ~12 events so we don't cross turn
    // boundaries on slow plays).
    const damageSummary = (cardId: string, startT: number): string => {
      const hits: Record<string, number> = {};
      const endIdx = Math.min(state.events.length, visibleCount + 12);
      let seenPlay = false;
      for (let i = 0; i < endIdx; i++) {
        const ev = state.events[i]!;
        if (ev.t < startT) continue;
        if (ev.t === startT) {
          seenPlay = true;
          continue;
        }
        if (!seenPlay) continue;
        if (ev.kind === 'ACTION_PLAY_ACTION' || ev.kind === 'ACTION_PLAY_OBJECT') break;
        if (ev.kind === 'DAMAGE' && ev.sourceCardId === cardId) {
          const key =
            ev.targetKind === 'boss'
              ? 'Colosse'
              : ev.targetKind === 'hero'
                ? `Héros ${design.heroes.find((x) => x.id === ev.targetId)?.nom ?? ev.targetId}`
                : `Monstre ${monstreName(design, state.heroes.flatMap((hh) => hh.queue).find((m) => m.instanceId === ev.targetId)?.cardId ?? ev.targetId)}`;
          hits[key] = (hits[key] ?? 0) + ev.amount;
        }
      }
      const parts = Object.entries(hits).map(([k, v]) => `${v} 🩸 ${k}`);
      return parts.join(' · ');
    };
    switch (spotlight.kind) {
      case 'ACTION_PLAY_ACTION': {
        const c = chasseOf(spotlight.card);
        const effetText = c?.effet ?? (c?.degats !== undefined ? `${c.degats} dégât(s)` : '');
        const damage = damageSummary(spotlight.card, spotlight.t);
        const effet = [effetText, damage].filter(Boolean).join('\n');
        return { kicker: '▶ joue', card: c?.nom ?? spotlight.card, effet };
      }
      case 'ACTION_PLAY_OBJECT': {
        const c = chasseOf(spotlight.card);
        return { kicker: '▼ pose', card: c?.nom ?? spotlight.card, effet: c?.effet ?? '' };
      }
      case 'OBJECT_USED': {
        const c = chasseOf(spotlight.card);
        const effetText = c?.effet ?? '';
        const damage = damageSummary(spotlight.card, spotlight.t);
        const effet = [effetText, damage].filter(Boolean).join('\n');
        return { kicker: '★ active', card: c?.nom ?? spotlight.card, effet };
      }
      case 'CAPACITE_USED':
        return {
          kicker: '⚡ capacité',
          card: heroCard.nom,
          effet: heroCard.capacite_speciale ?? '',
        };
      case 'ACTION_EXCHANGE':
        return {
          kicker: '⇄ échange',
          card: `seat ${spotlight.withSeat}`,
          effet:
            [
              spotlight.given.length > 0 && `donne ${spotlight.given.length}`,
              spotlight.received.length > 0 && `reçoit ${spotlight.received.length}`,
            ]
              .filter(Boolean)
              .join(' · ') || 'aucun transfert',
        };
    }
  })();

  return (
    <div
      className={`relative border rounded-xl p-4 bg-gradient-to-b from-stone-950/80 to-stone-900/60 backdrop-blur-sm transition-all duration-500 ${
        isActive
          ? `border-emerald-500 ${color.ringSoft} shadow-[0_0_0_2px_rgba(16,185,129,0.35)] animate-soft-pulse`
          : color.border
      } ${h.dead ? 'animate-death' : ''} ${shake ? 'animate-damage-shake' : ''} ${
        healGlow ? 'animate-heal-glow' : ''
      }`}
    >
      {spotlightLabel && (
        <div
          key={`${spotlight!.t}`}
          style={{ animationDuration: `${animSpeedMs}ms` }}
          className={`pointer-events-none absolute -top-4 left-1/2 -translate-x-1/2 z-10 max-w-[300px] px-3 py-2 rounded-lg bg-gradient-to-br from-stone-900 to-stone-800 border ${color.border} ${color.ringSoft} animate-spotlight ${color.text}`}
        >
          <div className="flex items-baseline gap-2">
            <span className="text-[9px] uppercase tracking-wider opacity-80">
              {spotlightLabel.kicker}
            </span>
            <span className="font-semibold text-sm">{spotlightLabel.card}</span>
          </div>
          {spotlightLabel.effet && (
            <div className="text-[11px] opacity-90 mt-0.5 leading-snug whitespace-pre-line">
              {spotlightLabel.effet}
            </div>
          )}
        </div>
      )}
      {/* Monster queue above the hero: head at top, tail at bottom. */}
      <div className="flex flex-col items-center mb-3 min-h-[1.5rem]">
        {h.queue.length === 0 ? (
          <span className="text-[10px] text-stone-600 italic">file vide</span>
        ) : (
          <>
            <span className="text-[9px] text-red-400 uppercase tracking-widest mb-1">
              ▼ tête (attaque)
            </span>
            <div className="flex flex-col space-y-1 w-full">
              {h.queue.map((m, i) => {
                const name = monstreName(design, m.cardId);
                const wounds = totalWoundsOf(m.wounds);
                return (
                  <button
                    key={m.instanceId}
                    onClick={() =>
                      inspect({ kind: 'monstre', id: m.cardId, instanceId: m.instanceId })
                    }
                    className={`w-full text-xs px-2 py-1 rounded-md text-left transition-colors hover:ring-1 hover:ring-sky-400 animate-slide-in-right ${
                      i === 0
                        ? 'bg-gradient-to-r from-red-900/80 to-red-800/60 text-red-100 shadow-[0_0_8px_rgba(239,68,68,0.2)]'
                        : 'bg-stone-800/80 text-stone-200'
                    }`}
                    title={`${name} — ${wounds} dégât${wounds > 1 ? 's' : ''} · clic pour détails`}
                  >
                    <span className="text-stone-500 mr-1">{i + 1}.</span>
                    {name}
                    {wounds > 0 && <span className="text-red-300 ml-1">({wounds})</span>}
                  </button>
                );
              })}
            </div>
            <span className="text-[9px] text-stone-500 uppercase tracking-widest mt-1">
              ▲ fond
            </span>
          </>
        )}
      </div>

      <div className="flex justify-between items-baseline mb-2">
        <div className="flex items-baseline gap-2 flex-wrap">
          <button
            onClick={() => inspect({ kind: 'hero', id: h.heroId })}
            className={`text-lg font-semibold ${color.text} hover:brightness-125 transition drop-shadow-sm`}
            title="Cliquer pour voir les détails"
          >
            {heroCard.nom}
          </button>
          <span className="text-[11px] text-stone-400 italic">{heroCard.titre}</span>
          {h.dead && <span className="text-red-400 text-xs font-semibold">✝ mort</span>}
          {isActive && (
            <span className="text-emerald-400 text-[10px] uppercase tracking-wider font-semibold">
              ◉ actif
            </span>
          )}
        </div>
        <div className="text-right">
          <div className="text-base font-mono">
            <span className={dmg > 0 ? 'text-red-200' : 'text-emerald-300'}>
              {h.vieMax - dmg}
            </span>
            <span className="text-stone-500">/{h.vieMax}</span>
          </div>
        </div>
      </div>

      <div className="flex space-x-1 mb-3">
        {Array.from({ length: h.vieMax }, (_, i) => (
          <div
            key={i}
            className={`h-2 flex-1 rounded-sm transition-colors duration-500 ${
              i < h.vieMax - dmg
                ? 'bg-gradient-to-b from-emerald-400 to-emerald-600'
                : 'bg-red-900/70'
            }`}
          />
        ))}
      </div>

      <div className="text-xs space-y-2">
        <div>
          <div className="text-stone-400 uppercase tracking-wider text-[10px] mb-1">
            Main ({h.hand.length})
          </div>
          <div className="flex flex-wrap gap-1">
            {h.hand.length === 0 ? (
              <span className="text-stone-600 italic">vide</span>
            ) : (
              h.hand.map((c, i) => {
                const reqHero = design.heroes.find((x) => x.nom === c.prerequis);
                const reqColor =
                  COMPETENCE_COLOR[reqHero?.competences[0] ?? ''] ?? DEFAULT_COLOR;
                return (
                  <button
                    key={i}
                    onClick={() => inspect({ kind: 'chasse', id: c.id })}
                    className={`px-2 py-0.5 rounded-md transition-all ${reqColor.handBg} ${reqColor.shadow} hover:brightness-125 hover:ring-1 ${reqColor.handRing} animate-slide-in-top`}
                    title={`${c.id} · ${c.categorie}${
                      c.degats !== undefined ? ' · ' + c.degats + ' dmg' : ''
                    } · requiert ${c.prerequis} · clic pour détails`}
                  >
                    {chasseName(design, c.id)}
                  </button>
                );
              })
            )}
          </div>
        </div>
        <div
          className={`p-1 -m-1 ${objectsFlash ? 'animate-row-highlight' : ''}`}
          style={objectsFlash ? { animationDuration: `${animSpeedMs}ms` } : undefined}
        >
          <div className="text-stone-400 uppercase tracking-wider text-[10px] mb-1">
            Objets posés ({h.objects.length})
          </div>
          <div className="flex flex-wrap gap-1">
            {h.objects.length === 0 ? (
              <span className="text-stone-600 italic">aucun</span>
            ) : (
              h.objects.map((c, i) => (
                <button
                  key={i}
                  onClick={() => inspect({ kind: 'chasse', id: c.id })}
                  className="px-2 py-0.5 rounded-md bg-amber-900/40 hover:bg-amber-800 hover:ring-1 hover:ring-amber-400 transition-all animate-slide-in-top"
                  title={`${c.id}${
                    c.bonus_degats !== undefined ? ' · +' + c.bonus_degats + ' dmg renfort' : ''
                  }${c.effet ? ' · ' + c.effet : ''} · clic pour détails`}
                >
                  {chasseName(design, c.id)}
                </button>
              ))
            )}
          </div>
        </div>
        <div
          className={`flex items-center gap-2 p-1 -m-1 ${capacityFlash ? 'animate-row-highlight' : ''}`}
          style={capacityFlash ? { animationDuration: `${animSpeedMs}ms` } : undefined}
        >
          <span className="text-stone-400 uppercase tracking-wider text-[10px]">Capacité</span>
          <span
            className={`text-[11px] font-medium ${
              h.capaciteUsed ? 'text-stone-500' : 'text-emerald-400'
            }`}
          >
            {h.capaciteUsed ? '○ utilisée' : '● prête'}
          </span>
        </div>
        {h.wounds.length > 0 && (
          <div>
            <div className="text-stone-400 uppercase tracking-wider text-[10px] mb-1">
              Blessures ({dmg})
            </div>
            <div className="flex flex-wrap gap-1">
              {h.wounds.map((w) => (
                <button
                  key={w.woundId}
                  onClick={() => {
                    const id = w.sourceCardId;
                    const isChasse = design.cartesChasse.some((c) => c.id === id);
                    const isMonster = design.monstres.some((m) => m.id === id);
                    const isMenace = design.menaces.some((m) => m.id === id);
                    const isDestin = design.destins.some((d) => d.id === id);
                    if (isChasse) inspect({ kind: 'chasse', id });
                    else if (isMonster) inspect({ kind: 'monstre', id });
                    else if (isMenace) inspect({ kind: 'menace', id });
                    else if (isDestin) inspect({ kind: 'destin', id });
                  }}
                  className="px-1.5 py-0.5 text-[10px] bg-red-950/80 text-red-200 rounded hover:bg-red-900 hover:ring-1 hover:ring-red-500 transition-colors"
                  title={`${w.source}:${w.sourceCardId} · ${w.degats} 🩸 · clic pour voir la source`}
                >
                  {w.degats}🩸
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
