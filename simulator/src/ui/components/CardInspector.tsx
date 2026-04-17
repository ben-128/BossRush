import { useStore, totalWoundsOf } from '../store.js';
import type { CardRef } from '../store.js';
import type { CardEffectEntry } from '../../engine/effectTypes.js';

/**
 * Modal that displays the full details of a selected card/hero/monster/boss.
 * Any clickable card in the game view calls store.inspect(ref) to open it.
 * Click outside or press Esc to close.
 */
export function CardInspector() {
  const ref = useStore((s) => s.inspected);
  const close = useStore((s) => s.inspect);
  if (!ref) return null;

  return (
    <div
      className="fixed inset-0 z-50 bg-black/70 flex items-center justify-center p-4"
      onClick={() => close(null)}
      onKeyDown={(e) => e.key === 'Escape' && close(null)}
      role="dialog"
      aria-modal="true"
    >
      <div
        className="bg-stone-900 border border-stone-600 rounded-lg max-w-lg w-full max-h-[85vh] overflow-auto shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="px-4 py-2 border-b border-stone-700 flex items-center justify-between">
          <span className="text-xs text-stone-400 uppercase">{ref.kind}</span>
          <button
            onClick={() => close(null)}
            className="text-stone-400 hover:text-stone-100 text-xl leading-none"
          >
            ×
          </button>
        </div>
        <div className="p-4">
          <Body refer={ref} />
        </div>
      </div>
    </div>
  );
}

function Body({ refer }: { refer: CardRef }) {
  const design = useStore((s) => s.design)!;
  const effects = useStore((s) => s.effects);
  const state = useStore((s) => s.state);

  switch (refer.kind) {
    case 'chasse': {
      const c = design.cartesChasse.find((x) => x.id === refer.id);
      if (!c) return <Missing id={refer.id} />;
      const entry = effects[refer.id];
      return (
        <Card
          title={c.nom}
          subtitle={`${refer.id} · ${c.categorie}${c.prerequis ? ` · prérequis: ${c.prerequis}` : ''}`}
          stats={[
            c.degats !== undefined ? `🩸 dégâts : ${c.degats}` : null,
            c.bonus_degats !== undefined ? `🩸 bonus : +${c.bonus_degats}` : null,
            `quantité dans le paquet : ${c.quantite}`,
          ].filter(Boolean) as string[]}
          rules={c.effet ?? undefined}
          dslEntry={entry}
        />
      );
    }
    case 'monstre': {
      const c = design.monstres.find((x) => x.id === refer.id);
      if (!c) return <Missing id={refer.id} />;
      const entry = effects[refer.id];
      // Look up the live instance if available for current wounds.
      let liveInfo: string | null = null;
      if (refer.instanceId && state) {
        for (const h of state.heroes) {
          const m = h.queue.find((mm) => mm.instanceId === refer.instanceId);
          if (m) {
            const total = totalWoundsOf(m.wounds);
            liveInfo = `en file seat ${h.seatIdx} · ${total}/${c.vie} dégâts encaissés${h.queue[0]?.instanceId === m.instanceId ? ' · en tête' : ''}`;
            break;
          }
        }
      }
      return (
        <Card
          title={c.nom}
          subtitle={`${refer.id} · monstre${liveInfo ? ' · ' + liveInfo : ''}`}
          stats={[
            `❤ vie : ${c.vie}`,
            `🩸 dégâts : ${c.degats}`,
            `quantité dans le paquet : ${c.quantite}`,
          ]}
          rules={c.capacite_speciale ?? c.description ?? undefined}
          citation={c.citation}
          dslEntry={entry}
        />
      );
    }
    case 'boss': {
      const c = design.boss.find((x) => x.id === refer.id);
      if (!c) return <Missing id={refer.id} />;
      const entry = effects[refer.id];
      return (
        <Card
          title={c.nom}
          subtitle={`${refer.id} · boss · difficulté ${c.difficulte} · PV ×${c.vie_multiplicateur}`}
          stats={[
            `séquence fin de tour : ${c.stats.sequence.join(' → ')}`,
          ]}
          rules={
            <div className="space-y-2">
              <div>
                <span className="text-stone-400 text-xs uppercase">Passif :</span>
                <div>{c.stats.passif}</div>
              </div>
              <div>
                <span className="text-stone-400 text-xs uppercase">⚡ Actif :</span>
                <div>{c.stats.actif}</div>
              </div>
              {c.lore && (
                <div className="text-xs text-stone-400 italic whitespace-pre-wrap border-l-2 border-stone-700 pl-2">
                  {c.lore}
                </div>
              )}
            </div>
          }
          dslEntry={entry}
        />
      );
    }
    case 'hero': {
      const c = design.heroes.find((x) => x.id === refer.id);
      if (!c) return <Missing id={refer.id} />;
      const entry = effects[refer.id];
      return (
        <Card
          title={`${c.nom} — ${c.titre}`}
          subtitle={`${refer.id} · héros`}
          stats={[
            `❤ vie : ${c.vie}`,
            `compétences : ${c.competences.join(', ')}`,
          ]}
          rules={
            <div>
              <span className="text-stone-400 text-xs uppercase">Capacité spéciale (1x/combat) :</span>
              <div>{c.capacite_speciale}</div>
            </div>
          }
          citation={c.citation}
          dslEntry={entry}
        />
      );
    }
    case 'menace': {
      const c = design.menaces.find((x) => x.id === refer.id);
      if (!c) return <Missing id={refer.id} />;
      const entry = effects[refer.id];
      return (
        <Card
          title={c.nom}
          subtitle={`${refer.id} · menace${c.type ? ' ' + c.type : ''}${c.sous_type ? ' / ' + c.sous_type : ''}`}
          stats={c.degats !== undefined ? [`🩸 dégâts : ${c.degats}`] : []}
          rules={c.description}
          dslEntry={entry}
        />
      );
    }
    case 'destin': {
      const c = design.destins.find((x) => x.id === refer.id);
      if (!c) return <Missing id={refer.id} />;
      const entry = effects[refer.id];
      return (
        <Card
          title={c.titre}
          subtitle={`${refer.id} · destin ${c.type}`}
          stats={c.degats !== undefined ? [`🩸 dégâts : ${c.degats}`] : []}
          rules={c.effet}
          citation={c.lore}
          dslEntry={entry}
        />
      );
    }
  }
}

function Card({
  title,
  subtitle,
  stats,
  rules,
  citation,
  dslEntry,
}: {
  title: string;
  subtitle: string;
  stats: string[];
  rules?: React.ReactNode | undefined;
  citation?: string | undefined;
  dslEntry?: CardEffectEntry | undefined;
}) {
  return (
    <div className="space-y-3">
      <div>
        <h3 className="text-lg font-semibold">{title}</h3>
        <div className="text-xs text-stone-400">{subtitle}</div>
      </div>
      {stats.length > 0 && (
        <div className="text-sm text-stone-300 space-y-0.5">
          {stats.map((s, i) => (
            <div key={i}>{s}</div>
          ))}
        </div>
      )}
      {rules && (
        <div className="text-sm bg-stone-950 border border-stone-800 rounded p-3 whitespace-pre-wrap">
          {rules}
        </div>
      )}
      {citation && (
        <div className="text-xs italic text-stone-400 border-l-2 border-stone-700 pl-2">
          {citation}
        </div>
      )}
      {dslEntry && (
        <div className="border border-stone-800 rounded p-2 bg-stone-950/50">
          <div className="text-xs uppercase text-stone-500 mb-1">Simulateur (DSL)</div>
          {dslEntry.tag && (
            <div className="text-xs text-emerald-400 mb-1">tag: {dslEntry.tag}</div>
          )}
          {dslEntry.effet && (
            <div className="text-xs text-stone-300 mb-1">{dslEntry.effet}</div>
          )}
          <pre className="text-[10px] font-mono text-stone-400 overflow-auto max-h-48">
            {JSON.stringify(
              {
                ...(dslEntry.ops ? { ops: dslEntry.ops } : {}),
                ...(dslEntry.triggers ? { triggers: dslEntry.triggers } : {}),
                ...(dslEntry.actif_ops ? { actif_ops: dslEntry.actif_ops } : {}),
                ...(dslEntry.passif_modifiers ? { passif_modifiers: dslEntry.passif_modifiers } : {}),
                ...(dslEntry.passif_hooks ? { passif_hooks: dslEntry.passif_hooks } : {}),
              },
              null,
              2,
            )}
          </pre>
        </div>
      )}
    </div>
  );
}

function Missing({ id }: { id: string }) {
  return <div className="text-red-400 text-sm">Carte introuvable : {id}</div>;
}
