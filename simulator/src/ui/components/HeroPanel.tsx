import { useStore, totalWoundsOf } from '../store.js';
import { chasseName, monstreName } from '../naming.js';

interface Props {
  seat: number;
}

const COMPETENCE_COLOR: Record<string, { text: string; handBg: string; handRing: string; shadow: string }> = {
  magie:      { text: 'text-orange-300',  handBg: 'bg-orange-900/40',  handRing: 'hover:ring-orange-400',  shadow: 'shadow-[0_0_8px_rgba(251,146,60,0.5)]' },
  soin:       { text: 'text-emerald-300', handBg: 'bg-emerald-900/40', handRing: 'hover:ring-emerald-400', shadow: 'shadow-[0_0_8px_rgba(52,211,153,0.5)]' },
  armure:     { text: 'text-slate-300',   handBg: 'bg-slate-700/40',   handRing: 'hover:ring-slate-300',   shadow: 'shadow-[0_0_8px_rgba(203,213,225,0.4)]' },
  distance:   { text: 'text-sky-300',     handBg: 'bg-sky-900/40',     handRing: 'hover:ring-sky-400',     shadow: 'shadow-[0_0_8px_rgba(56,189,248,0.5)]' },
  diplomatie: { text: 'text-fuchsia-300', handBg: 'bg-fuchsia-900/40', handRing: 'hover:ring-fuchsia-400', shadow: 'shadow-[0_0_8px_rgba(232,121,249,0.5)]' },
};
const DEFAULT_COLOR = { text: 'text-stone-200', handBg: 'bg-sky-900/50', handRing: 'hover:ring-sky-400', shadow: '' };

export function HeroPanel({ seat }: Props) {
  const state = useStore((s) => s.state)!;
  const design = useStore((s) => s.design)!;
  const inspect = useStore((s) => s.inspect);
  const h = state.heroes[seat];
  if (!h) return null;
  const heroCard = design.heroes.find((x) => x.id === h.heroId);
  if (!heroCard) return null;
  const dmg = totalWoundsOf(h.wounds);
  const isActive = state.activeSeat === seat && state.result === 'running';
  const color = COMPETENCE_COLOR[heroCard.competences[0] ?? ''] ?? DEFAULT_COLOR;

  return (
    <div
      className={`border rounded-lg p-3 bg-stone-950/50 ${
        isActive ? 'border-emerald-500 shadow-[0_0_0_1px_rgba(16,185,129,0.3)]' : 'border-stone-700'
      } ${h.dead ? 'opacity-50' : ''}`}
    >
      {/* Monster queue above the hero: head (attacks first) at top, tail at bottom. */}
      <div className="flex flex-col items-center mb-2 min-h-[1.5rem]">
        {h.queue.length === 0 ? (
          <span className="text-[10px] text-stone-600 italic">file vide</span>
        ) : (
          <>
            <span className="text-[9px] text-red-400 uppercase tracking-wider mb-0.5">
              ▼ tête (attaque)
            </span>
            <div className="flex flex-col space-y-0.5 w-full">
              {h.queue.map((m, i) => {
                const name = monstreName(design, m.cardId);
                const wounds = totalWoundsOf(m.wounds);
                return (
                  <button
                    key={m.instanceId}
                    onClick={() => inspect({ kind: 'monstre', id: m.cardId, instanceId: m.instanceId })}
                    className={`w-full text-xs px-2 py-0.5 rounded text-left hover:ring-1 hover:ring-sky-400 ${
                      i === 0 ? 'bg-red-900/70 text-red-100' : 'bg-stone-800'
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
            <span className="text-[9px] text-stone-500 uppercase tracking-wider mt-0.5">
              ▲ fond
            </span>
          </>
        )}
      </div>

      <div className="flex justify-between items-baseline mb-1">
        <div>
          <button
            onClick={() => inspect({ kind: 'hero', id: h.heroId })}
            className={`font-semibold ${color.text} hover:brightness-125 transition`}
            title="Cliquer pour voir les détails"
          >
            {heroCard.nom}
          </button>
          <span className="text-xs text-stone-400 ml-2">
            {heroCard.titre} · seat {seat}
          </span>
          {h.dead && <span className="ml-2 text-red-400 text-xs">✝</span>}
          {isActive && <span className="ml-2 text-emerald-400 text-xs">◉ actif</span>}
        </div>
        <div className="text-sm font-mono">
          {h.vieMax - dmg}/{h.vieMax}
        </div>
      </div>

      <div className="flex space-x-1 mb-2">
        {Array.from({ length: h.vieMax }, (_, i) => (
          <div
            key={i}
            className={`h-2 flex-1 rounded-sm ${
              i < h.vieMax - dmg ? 'bg-emerald-500' : 'bg-red-800'
            }`}
          />
        ))}
      </div>

      <div className="text-xs space-y-1">
        <div>
          <span className="text-stone-400">Main ({h.hand.length})</span>:{' '}
          {h.hand.length === 0 ? (
            <span className="text-stone-600">vide</span>
          ) : (
            h.hand.map((c, i) => {
              const reqHero = design.heroes.find((x) => x.nom === c.prerequis);
              const reqColor =
                COMPETENCE_COLOR[reqHero?.competences[0] ?? ''] ?? DEFAULT_COLOR;
              return (
                <button
                  key={i}
                  onClick={() => inspect({ kind: 'chasse', id: c.id })}
                  className={`inline-block px-1 mx-0.5 rounded ${reqColor.handBg} ${reqColor.shadow} hover:brightness-125 hover:ring-1 ${reqColor.handRing}`}
                  title={`${c.id} · ${c.categorie}${c.degats !== undefined ? ' · ' + c.degats + ' dmg' : ''} · requiert ${c.prerequis} · clic pour détails`}
                >
                  {chasseName(design, c.id)}
                </button>
              );
            })
          )}
        </div>
        <div>
          <span className="text-stone-400">Objets posés ({h.objects.length})</span>:{' '}
          {h.objects.length === 0 ? (
            <span className="text-stone-600">aucun</span>
          ) : (
            h.objects.map((c, i) => (
              <button
                key={i}
                onClick={() => inspect({ kind: 'chasse', id: c.id })}
                className="inline-block px-1 mx-0.5 rounded bg-amber-900/40 hover:bg-amber-800 hover:ring-1 hover:ring-amber-400"
                title={`${c.id}${c.bonus_degats !== undefined ? ' · +' + c.bonus_degats + ' dmg renfort' : ''}${c.effet ? ' · ' + c.effet : ''} · clic pour détails`}
              >
                {chasseName(design, c.id)}
              </button>
            ))
          )}
        </div>
        <div>
          <span className="text-stone-400">Capacité</span>:{' '}
          <span className={h.capaciteUsed ? 'text-stone-600' : 'text-emerald-400'}>
            {h.capaciteUsed ? 'utilisée' : 'prête'}
          </span>
        </div>
        {h.wounds.length > 0 && (
          <div>
            <span className="text-stone-400">Blessures ({dmg})</span>:{' '}
            {h.wounds.map((w, i) => (
              <button
                key={w.woundId}
                onClick={() => {
                  // Click a wound → inspect the source card if we can identify it.
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
                className="inline-block px-1 mx-0.5 text-[10px] bg-red-950 text-red-200 rounded hover:bg-red-900 hover:ring-1 hover:ring-red-500"
                title={`${w.source}:${w.sourceCardId} · ${w.degats} 🩸 · clic pour voir la source`}
              >
                {w.degats}🩸
                {i < h.wounds.length - 1 && ''}
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
