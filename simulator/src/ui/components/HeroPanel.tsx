import { useStore, totalWoundsOf } from '../store.js';

interface Props {
  seat: number;
}

export function HeroPanel({ seat }: Props) {
  const state = useStore((s) => s.state)!;
  const design = useStore((s) => s.design)!;
  const h = state.heroes[seat];
  if (!h) return null;
  const heroCard = design.heroes.find((x) => x.id === h.heroId);
  if (!heroCard) return null;
  const dmg = totalWoundsOf(h.wounds);
  const isActive = state.activeSeat === seat && state.result === 'running';

  return (
    <div
      className={`border rounded-lg p-3 bg-stone-950/50 ${
        isActive ? 'border-emerald-500 shadow-[0_0_0_1px_rgba(16,185,129,0.3)]' : 'border-stone-700'
      } ${h.dead ? 'opacity-50' : ''}`}
    >
      <div className="flex justify-between items-baseline mb-1">
        <div>
          <span className="font-semibold">{heroCard.nom}</span>
          <span className="text-xs text-stone-400 ml-2">seat {seat}</span>
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
          <span className="text-stone-400">File ({h.queue.length})</span>:{' '}
          {h.queue.length === 0 ? (
            <span className="text-stone-600">vide</span>
          ) : (
            h.queue.map((m, i) => (
              <span
                key={m.instanceId}
                className={`inline-block px-1 mx-0.5 rounded ${
                  i === 0 ? 'bg-red-900/70 text-red-100' : 'bg-stone-800'
                }`}
                title={`${m.cardId} — ${totalWoundsOf(m.wounds)} dégâts`}
              >
                {m.cardId.slice(4)}
              </span>
            ))
          )}
        </div>
        <div>
          <span className="text-stone-400">Main ({h.hand.length})</span>:{' '}
          <span className="text-stone-300">
            {h.hand.map((c) => c.id).join(', ') || '—'}
          </span>
        </div>
        {h.objects.length > 0 && (
          <div>
            <span className="text-stone-400">Objets posés</span>:{' '}
            {h.objects.map((c) => c.id).join(', ')}
          </div>
        )}
        <div>
          <span className="text-stone-400">Capacité</span>:{' '}
          <span className={h.capaciteUsed ? 'text-stone-600' : 'text-emerald-400'}>
            {h.capaciteUsed ? 'utilisée' : 'prête'}
          </span>
        </div>
      </div>
    </div>
  );
}
