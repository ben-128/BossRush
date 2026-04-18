/**
 * DecisionModal — UI overlay for the HumanPolicy.
 *
 * Reads `pendingDecision` from the store and renders the appropriate set of
 * buttons. When the user clicks one, we resolve the pending Promise (handing
 * back the selection) and clear the pending state.
 *
 * Decision kinds:
 *   - action       → the user picks a main action (draw / play / useCapacite /
 *                    useObject / exchange / none)
 *   - reaction     → same but may also be "pass" (null)
 *   - choice       → a card presents N labelled options; pick one
 *   - heroTarget   → pick a hero among candidates
 *   - monsterTarget→ pick a monster instance among candidates
 */

import { useState } from 'react';
import { useStore, type CardRef } from '../store.js';
import type { PlayerAction } from '../../engine/actions.js';
import { isActionPlayableNow, isObjetPlayableRenfort } from '../../engine/actions.js';

/** Small ℹ button that opens the CardInspector without bubbling to the parent. */
function InfoBtn({ card }: { card: CardRef }) {
  const inspect = useStore((s) => s.inspect);
  return (
    <span
      role="button"
      tabIndex={0}
      onClick={(e) => {
        e.stopPropagation();
        inspect(card);
      }}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.stopPropagation();
          inspect(card);
        }
      }}
      title="Voir la carte"
      className="inline-flex items-center justify-center w-4 h-4 ml-1 text-[10px] rounded-full bg-stone-600/70 hover:bg-stone-500 text-stone-100 cursor-pointer"
    >
      ℹ
    </span>
  );
}

export function DecisionModal() {
  const decision = useStore((s) => s.pendingDecision);
  const setDecision = useStore((s) => s.setPendingDecision);
  const state = useStore((s) => s.state);
  const [minimized, setMinimized] = useState(false);

  // Reset minimized state whenever a new decision arrives. The identity of
  // the decision object itself differs per call, so we key on it directly.
  const decisionKey = (decision as object | null);
  const [lastKey, setLastKey] = useState<object | null>(null);
  if (decisionKey !== lastKey) {
    setLastKey(decisionKey);
    if (minimized) setMinimized(false);
  }

  if (!decision || !state) return null;

  const resolve = <T,>(value: T) => {
    // TS-wise `decision.resolve` is a union of functions; we narrow per kind
    // at call sites. Here we just invoke after clearing.
    setDecision(null);
    (decision.resolve as (v: T) => void)(value);
  };

  let title = '';
  let body: React.ReactNode = null;

  if (decision.kind === 'action' || decision.kind === 'reaction') {
    title =
      decision.kind === 'action'
        ? `Action — seat ${decision.seat}`
        : `Réaction — seat ${decision.seat}`;
    body = (
      <ActionPicker
        seat={decision.seat}
        isReaction={decision.kind === 'reaction'}
        onPick={(a) => resolve<PlayerAction | null>(a)}
      />
    );
  } else if (decision.kind === 'choice') {
    // The source of a choice can be a Chasse card (hero action), a Menace, a
    // Destin, a Monstre, or even a Boss — pick the right catalog so the
    // "Voir la carte" link opens the correct inspector view.
    const srcId = decision.sourceCardId;
    let srcKind: CardRef['kind'] = 'chasse';
    let srcName: string | undefined;
    if (state.catalog.chasseById.has(srcId)) {
      srcKind = 'chasse';
      srcName = state.catalog.chasseById.get(srcId)?.nom;
    } else if (state.catalog.menaceById.has(srcId)) {
      srcKind = 'menace';
      srcName = state.catalog.menaceById.get(srcId)?.nom;
    } else if (state.catalog.destinById.has(srcId)) {
      srcKind = 'destin';
      srcName = state.catalog.destinById.get(srcId)?.titre;
    } else if (state.catalog.monstreById.has(srcId)) {
      srcKind = 'monstre';
      srcName = state.catalog.monstreById.get(srcId)?.nom;
    } else if (state.catalog.bossById.has(srcId)) {
      srcKind = 'boss';
      srcName = state.catalog.bossById.get(srcId)?.nom;
    }
    title = `Choix — ${srcName ?? srcId}`;
    body = (
      <div className="flex flex-col gap-2">
        <div className="text-xs text-stone-400">
          Source : « {srcName ?? srcId} » <span className="text-stone-600">[{srcKind}]</span>
          <InfoBtn card={{ kind: srcKind, id: srcId }} />
        </div>
        {decision.options.map((o, i) => (
          <button
            key={i}
            onClick={() => resolve<number>(i)}
            className="px-4 py-2 bg-stone-700 hover:bg-stone-600 rounded text-left"
          >
            {o.label}
          </button>
        ))}
      </div>
    );
  } else if (decision.kind === 'heroTarget') {
    title = `Cible héros — seat ${decision.seat}`;
    body = (
      <div className="flex flex-col gap-2">
        {decision.candidates.map((seat, i) => {
          const h = state.heroes[seat];
          const name = h ? state.catalog.heroesById.get(h.heroId)?.nom ?? h.heroId : `seat ${seat}`;
          return (
            <button
              key={i}
              onClick={() => resolve<number>(i)}
              className="px-4 py-2 bg-stone-700 hover:bg-stone-600 rounded text-left"
            >
              {name} <span className="text-stone-400 text-xs">(seat {seat})</span>
              {h && <InfoBtn card={{ kind: 'hero', id: h.heroId }} />}
            </button>
          );
        })}
      </div>
    );
  } else if (decision.kind === 'monsterTarget') {
    title = `Cible monstre — seat ${decision.seat}`;
    body = (
      <div className="flex flex-col gap-2">
        {decision.candidates.map((c, i) => {
          const mname = state.catalog.monstreById.get(c.cardId)?.nom ?? c.cardId;
          return (
            <button
              key={i}
              onClick={() => resolve<number>(i)}
              className="px-4 py-2 bg-stone-700 hover:bg-stone-600 rounded text-left"
            >
              {mname} <span className="text-stone-400 text-xs">(seat {c.seat})</span>
              <InfoBtn card={{ kind: 'monstre', id: c.cardId, instanceId: c.instanceId }} />
            </button>
          );
        })}
      </div>
    );
  } else if (decision.kind === 'discard') {
    body = <DiscardPicker seat={decision.seat} n={decision.n} onPick={(idx) => resolve<number[]>(idx)} />;
    const heroName = state.heroes[decision.seat]
      ? state.catalog.heroesById.get(state.heroes[decision.seat]!.heroId)?.nom
      : `seat ${decision.seat}`;
    title = `Défausser ${decision.n} carte${decision.n > 1 ? 's' : ''} — ${heroName}`;
  } else if (decision.kind === 'confirmReactive') {
    const card = state.catalog.chasseById.get(decision.objectCardId);
    const heroName = state.heroes[decision.seat]
      ? state.catalog.heroesById.get(state.heroes[decision.seat]!.heroId)?.nom
      : `seat ${decision.seat}`;
    title = `Utiliser « ${card?.nom ?? decision.objectCardId} » ?`;
    body = (
      <div className="flex flex-col gap-3">
        <div className="text-sm text-stone-300">
          Objet posé de <span className="text-amber-200">{heroName}</span> — déclencheur :{' '}
          <span className="font-mono text-stone-400">{decision.trigger}</span>
          <InfoBtn card={{ kind: 'chasse', id: decision.objectCardId }} />
        </div>
        {card?.effet && (
          <div className="text-xs bg-stone-950 border border-stone-800 rounded p-2 whitespace-pre-wrap text-stone-300">
            {card.effet}
          </div>
        )}
        <div className="flex gap-2">
          <button
            onClick={() => resolve<boolean>(true)}
            className="flex-1 px-4 py-2 bg-emerald-700 hover:bg-emerald-600 rounded font-medium"
          >
            ✓ Utiliser (consommer)
          </button>
          <button
            onClick={() => resolve<boolean>(false)}
            className="flex-1 px-4 py-2 bg-stone-700 hover:bg-stone-600 rounded"
          >
            ✗ Garder pour plus tard
          </button>
        </div>
      </div>
    );
  }

  if (minimized) {
    return (
      <div className="fixed bottom-3 left-1/2 -translate-x-1/2 z-50">
        <button
          onClick={() => setMinimized(false)}
          className="flex items-center gap-2 px-4 py-2 bg-amber-800 hover:bg-amber-700 border border-amber-500 rounded-lg shadow-2xl text-sm text-amber-100"
          title="Rouvrir la fenêtre de choix"
        >
          <span>▲</span>
          <span>Décision en attente : <span className="text-amber-300">{title}</span></span>
        </button>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-50 bg-black/70 flex items-center justify-center p-4">
      <div className="bg-stone-900 border border-stone-700 rounded-lg shadow-2xl p-5 min-w-[480px] max-w-[860px] max-h-[90vh] overflow-auto">
        <div className="flex items-start justify-between gap-3 mb-3">
          <h2 className="text-base font-semibold text-amber-200">{title}</h2>
          <button
            onClick={() => setMinimized(true)}
            title="Minimiser en bas de l'écran pour voir le plateau"
            className="flex-none px-2 py-1 text-xs bg-stone-800 hover:bg-stone-700 border border-stone-700 rounded text-stone-300"
          >
            ▼ Réduire
          </button>
        </div>
        {body}
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Action picker — builds a PlayerAction step by step
// ---------------------------------------------------------------------------

function ActionPicker({
  seat,
  isReaction,
  onPick,
}: {
  seat: number;
  isReaction: boolean;
  onPick: (a: PlayerAction | null) => void;
}) {
  const state = useStore((s) => s.state)!;
  const hero = state.heroes[seat];
  const [mode, setMode] = useState<'root' | 'play' | 'exchange'>('root');
  const [playObject, setPlayObject] = useState<number | undefined>(undefined);
  const [playAction, setPlayAction] = useState<number | undefined>(undefined);
  const [renforts, setRenforts] = useState<number[]>([]);
  const [exchSeat, setExchSeat] = useState<number | null>(null);
  const [give, setGive] = useState<number[]>([]);
  const [take, setTake] = useState<number[]>([]);

  if (!hero) {
    onPick({ kind: 'none', reason: 'no hero' });
    return null;
  }

  const chName = (id: string) => state.catalog.chasseById.get(id)?.nom ?? id;

  if (mode === 'root') {
    // Une « réaction » n'est PAS une nouvelle action principale : elle sert
    // uniquement à déclencher la capacité spéciale ou à poser l'objet bonus
    // (ROD_A04 Tir de couverture). On masque donc les autres options pour
    // éviter de jouer une seconde action en un tour.
    return (
      <div className="flex flex-col gap-2">
        <HandView hero={hero} />
        <div className="grid grid-cols-2 gap-2 mt-2">
          {!isReaction && (
            <button
              className="px-3 py-2 bg-sky-700 hover:bg-sky-600 rounded"
              onClick={() => onPick({ kind: 'draw', reason: 'human' })}
            >
              Piocher (2)
            </button>
          )}
          {!isReaction && (
            <button
              className="px-3 py-2 bg-emerald-700 hover:bg-emerald-600 rounded disabled:opacity-40"
              onClick={() => setMode('play')}
              disabled={hero.hand.length === 0}
            >
              Jouer…
            </button>
          )}
          <button
            className="px-3 py-2 bg-amber-700 hover:bg-amber-600 rounded disabled:opacity-40"
            onClick={() => onPick({ kind: 'useCapacite', reason: 'human' })}
            disabled={hero.capaciteUsed}
          >
            Capacité
          </button>
          {!isReaction && (
            <button
              className="px-3 py-2 bg-purple-700 hover:bg-purple-600 rounded disabled:opacity-40"
              onClick={() => setMode('exchange')}
              disabled={state.heroes.filter((h) => h && !h.dead).length < 2}
            >
              Échanger…
            </button>
          )}
          {/* Réaction : pose bonus ROD_A04 si disponible. */}
          {isReaction && hero.extraPoseAvailable && (
            <button
              className="px-3 py-2 bg-teal-700 hover:bg-teal-600 rounded disabled:opacity-40"
              onClick={() => setMode('play')}
              disabled={hero.hand.length === 0}
            >
              Poser un objet bonus…
            </button>
          )}
        </div>
        <div className="flex gap-2 mt-3 border-t border-stone-700 pt-3">
          {isReaction && (
            <button
              className="px-3 py-2 bg-stone-700 hover:bg-stone-600 rounded"
              onClick={() => onPick(null)}
            >
              Passer (pas de réaction)
            </button>
          )}
          {!isReaction && (
            <button
              className="px-3 py-2 bg-stone-700 hover:bg-stone-600 rounded"
              onClick={() => onPick({ kind: 'none', reason: 'human pass' })}
            >
              Ne rien faire
            </button>
          )}
        </div>
      </div>
    );
  }

  if (mode === 'play') {
    // Only objets whose prerequis matches this hero can be posed.
    const heroNom = state.catalog.heroesById.get(hero.heroId)?.nom;
    const objects = hero.hand
      .map((c, i) => ({ c, i }))
      .filter(({ c }) => c.categorie === 'objet' && (!c.prerequis || c.prerequis === heroNom));
    const actions = hero.hand
      .map((c, i) => ({ c, i }))
      .filter(({ c }) => isActionPlayableNow(state, seat, c));
    // Renforts are taken from POSED objects (hero.objects), not hand. The
    // engine's playAction consumes them from h.objects.
    const renfortCandidates = hero.objects
      .map((c, i) => ({ c, i }))
      .filter(({ c }) => isObjetPlayableRenfort(state, c));

    const toggleRenfort = (i: number) => {
      setRenforts((r) => (r.includes(i) ? r.filter((x) => x !== i) : [...r, i]));
    };

    return (
      <div className="flex flex-col gap-3">
        <div className="text-xs text-amber-300/80 italic">
          {isReaction
            ? 'Pose bonus (ROD_A04 Tir de couverture) — 1 objet uniquement, sans jouer d\'action.'
            : 'Règle : 1 seule carte jouée par action Play (action ou objet, pas les deux).'}
        </div>
        <div>
          <div className="text-xs text-stone-400 mb-1">Poser un objet</div>
          <div className="flex flex-wrap gap-1">
            {objects.map(({ c, i }) => (
              <button
                key={i}
                className={`px-2 py-1 text-xs rounded ${playObject === i ? 'bg-emerald-700' : 'bg-stone-800 hover:bg-stone-700'}`}
                onClick={() => { setPlayObject(i); setPlayAction(undefined); setRenforts([]); }}
              >
                {chName(c.id)}
                <InfoBtn card={{ kind: 'chasse', id: c.id }} />
              </button>
            ))}
            {objects.length === 0 && <span className="text-stone-600 text-xs italic">aucun objet jouable</span>}
          </div>
        </div>
        {!isReaction && (
          <>
            <div className="text-center text-stone-500 text-xs">— ou —</div>
            <div>
              <div className="text-xs text-stone-400 mb-1">Jouer une action</div>
              <div className="flex flex-wrap gap-1">
                {actions.map(({ c, i }) => (
                  <button
                    key={i}
                    className={`px-2 py-1 text-xs rounded ${playAction === i ? 'bg-emerald-700' : 'bg-stone-800 hover:bg-stone-700'}`}
                    onClick={() => { setPlayAction(i); setPlayObject(undefined); }}
                  >
                    {chName(c.id)} {c.degats ? `(${c.degats}🩸)` : ''}
                    <InfoBtn card={{ kind: 'chasse', id: c.id }} />
                  </button>
                ))}
                {actions.length === 0 && <span className="text-stone-600 text-xs italic">aucune action jouable</span>}
              </div>
            </div>
          </>
        )}
        {!isReaction && playAction !== undefined && renfortCandidates.length > 0 && (
          <div>
            <div className="text-xs text-stone-400 mb-1">
              Renforts (depuis tes objets <em>posés</em>, optionnel)
            </div>
            <div className="flex flex-wrap gap-1">
              {renfortCandidates.map(({ c, i }) => {
                const active = renforts.includes(i);
                return (
                  <button
                    key={i}
                    className={`px-2 py-1 text-xs rounded ${active ? 'bg-amber-700' : 'bg-stone-800 hover:bg-stone-700'}`}
                    onClick={() => toggleRenfort(i)}
                  >
                    {chName(c.id)}
                    <InfoBtn card={{ kind: 'chasse', id: c.id }} />
                  </button>
                );
              })}
            </div>
          </div>
        )}
        <div className="flex gap-2 pt-2 border-t border-stone-700">
          <button
            className="px-3 py-2 bg-emerald-700 hover:bg-emerald-600 rounded disabled:opacity-40"
            onClick={() => {
              const a: PlayerAction = { kind: 'play', reason: 'human' };
              if (playObject !== undefined) a.placeObject = playObject;
              if (playAction !== undefined) a.playAction = playAction;
              if (renforts.length) a.renforts = renforts;
              onPick(a);
            }}
            disabled={playObject === undefined && playAction === undefined}
          >
            Valider
          </button>
          <button
            className="px-3 py-2 bg-stone-700 hover:bg-stone-600 rounded"
            onClick={() => {
              setMode('root');
              setPlayObject(undefined);
              setPlayAction(undefined);
              setRenforts([]);
            }}
          >
            Retour
          </button>
        </div>
      </div>
    );
  }

  if (mode === 'exchange') {
    const otherSeats = state.heroes
      .map((h, i) => (h && !h.dead && i !== seat ? i : -1))
      .filter((i) => i >= 0);
    const other = exchSeat != null ? state.heroes[exchSeat] : null;
    const toggle = (arr: number[], set: (n: number[]) => void, i: number) =>
      set(arr.includes(i) ? arr.filter((x) => x !== i) : [...arr, i]);

    return (
      <div className="flex flex-col gap-3">
        <div>
          <div className="text-xs text-stone-400 mb-1">Avec quel héros ?</div>
          <div className="flex flex-wrap gap-1">
            {otherSeats.map((s) => {
              const h = state.heroes[s]!;
              const name = state.catalog.heroesById.get(h.heroId)?.nom ?? h.heroId;
              return (
                <button
                  key={s}
                  className={`px-2 py-1 text-xs rounded ${exchSeat === s ? 'bg-purple-700' : 'bg-stone-800 hover:bg-stone-700'}`}
                  onClick={() => { setExchSeat(s); setGive([]); setTake([]); }}
                >
                  {name} (seat {s})
                  <InfoBtn card={{ kind: 'hero', id: h.heroId }} />
                </button>
              );
            })}
          </div>
        </div>
        {other && (() => {
          const myNom = state.catalog.heroesById.get(hero.heroId)?.nom;
          const otherNom = state.catalog.heroesById.get(other.heroId)?.nom;
          // Only cards the *partner* can use are legal gives.
          const giveChoices = hero.hand
            .map((c, i) => ({ c, i }))
            .filter(({ c }) => !c.prerequis || c.prerequis === otherNom);
          // Only cards *we* can use are legal takes.
          const takeChoices = other.hand
            .map((c, i) => ({ c, i }))
            .filter(({ c }) => !c.prerequis || c.prerequis === myNom);
          return (
            <>
              <div className="text-xs text-amber-300/80 italic">
                Règle : on ne donne que des cartes utilisables par l'autre héros, et on ne reçoit que ce qu'on peut utiliser soi-même.
              </div>
              <div>
                <div className="text-xs text-stone-400 mb-1">Donner (cartes utilisables par {otherNom})</div>
                <div className="flex flex-wrap gap-1">
                  {giveChoices.map(({ c, i }) => (
                    <button
                      key={i}
                      className={`px-2 py-1 text-xs rounded ${give.includes(i) ? 'bg-red-700' : 'bg-stone-800 hover:bg-stone-700'}`}
                      onClick={() => toggle(give, setGive, i)}
                    >
                      {chName(c.id)}
                      <InfoBtn card={{ kind: 'chasse', id: c.id }} />
                    </button>
                  ))}
                  {giveChoices.length === 0 && (
                    <span className="text-stone-600 text-xs italic">aucune carte donnable à {otherNom}</span>
                  )}
                </div>
              </div>
              <div>
                <div className="text-xs text-stone-400 mb-1">Recevoir (cartes utilisables par toi)</div>
                <div className="flex flex-wrap gap-1">
                  {takeChoices.map(({ c, i }) => (
                    <button
                      key={i}
                      className={`px-2 py-1 text-xs rounded ${take.includes(i) ? 'bg-green-700' : 'bg-stone-800 hover:bg-stone-700'}`}
                      onClick={() => toggle(take, setTake, i)}
                    >
                      {chName(c.id)}
                      <InfoBtn card={{ kind: 'chasse', id: c.id }} />
                    </button>
                  ))}
                  {takeChoices.length === 0 && (
                    <span className="text-stone-600 text-xs italic">aucune carte utilisable dans sa main</span>
                  )}
                </div>
              </div>
            </>
          );
        })()}
        <div className="flex gap-2 pt-2 border-t border-stone-700">
          <button
            className="px-3 py-2 bg-purple-700 hover:bg-purple-600 rounded disabled:opacity-40"
            onClick={() =>
              exchSeat != null &&
              onPick({ kind: 'exchange', withSeat: exchSeat, give, take, reason: 'human' })
            }
            disabled={exchSeat == null || (give.length === 0 && take.length === 0)}
          >
            Valider l'échange
          </button>
          <button
            className="px-3 py-2 bg-stone-700 hover:bg-stone-600 rounded"
            onClick={() => { setMode('root'); setExchSeat(null); setGive([]); setTake([]); }}
          >
            Retour
          </button>
        </div>
      </div>
    );
  }

  return null;
}

function DiscardPicker({
  seat,
  n,
  onPick,
}: {
  seat: number;
  n: number;
  onPick: (indices: number[]) => void;
}) {
  const state = useStore((s) => s.state)!;
  const hero = state.heroes[seat];
  const [selected, setSelected] = useState<number[]>([]);
  if (!hero) {
    onPick([]);
    return null;
  }
  const chName = (id: string) => state.catalog.chasseById.get(id)?.nom ?? id;
  const toggle = (i: number) => {
    setSelected((sel) => {
      if (sel.includes(i)) return sel.filter((x) => x !== i);
      if (sel.length >= n) return sel; // cap at n
      return [...sel, i];
    });
  };
  return (
    <div className="flex flex-col gap-3">
      <div className="text-xs text-stone-400">
        Choisis <span className="text-amber-300">{n}</span> carte{n > 1 ? 's' : ''} à défausser ({selected.length}/{n} sélectionnée{selected.length > 1 ? 's' : ''}) :
      </div>
      <div className="flex flex-wrap gap-1">
        {hero.hand.map((c, i) => {
          const active = selected.includes(i);
          return (
            <button
              key={i}
              className={`px-2 py-1 text-xs rounded ${active ? 'bg-red-700' : 'bg-stone-800 hover:bg-stone-700'}`}
              onClick={() => toggle(i)}
            >
              {chName(c.id)}
              <InfoBtn card={{ kind: 'chasse', id: c.id }} />
            </button>
          );
        })}
      </div>
      <div className="flex gap-2 pt-2 border-t border-stone-700">
        <button
          className="px-3 py-2 bg-red-700 hover:bg-red-600 rounded disabled:opacity-40"
          onClick={() => onPick(selected)}
          disabled={selected.length !== Math.min(n, hero.hand.length)}
        >
          Défausser
        </button>
      </div>
    </div>
  );
}

function HandView({ hero }: { hero: { hand: { id: string }[]; objects: { id: string }[] } }) {
  const state = useStore((s) => s.state)!;
  const chName = (id: string) => state.catalog.chasseById.get(id)?.nom ?? id;
  return (
    <div className="text-xs text-stone-400 space-y-1">
      <div>
        <span className="text-stone-500">Main : </span>
        {hero.hand.length === 0 ? <em className="text-stone-600">vide</em> :
          hero.hand.map((c, i) => (
            <span key={i} className="inline-block mr-2 text-stone-300">« {chName(c.id)} »<InfoBtn card={{ kind: 'chasse', id: c.id }} /></span>
          ))}
      </div>
      {hero.objects.length > 0 && (
        <div>
          <span className="text-stone-500">Objets posés : </span>
          {hero.objects.map((c, i) => (
            <span key={i} className="inline-block mr-2 text-stone-300">« {chName(c.id)} »<InfoBtn card={{ kind: 'chasse', id: c.id }} /></span>
          ))}
        </div>
      )}
    </div>
  );
}
