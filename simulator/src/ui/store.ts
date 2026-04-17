import { create } from 'zustand';
import type { DesignData } from '../engine/types.js';
import type { EffectsCatalog } from '../engine/effectTypes.js';
import type { GameState } from '../engine/gameState.js';
import type { GameEvent } from '../engine/events.js';
import { createGame } from '../engine/setup.js';
import { runTurn, runGame } from '../engine/engine.js';
import { heuristicPolicy } from '../ai/heuristic.js';
import { loadAllData } from './browserLoader.js';

export type View = 'setup' | 'game' | 'batch' | 'dashboard';

export type CardRef =
  | { kind: 'chasse'; id: string }
  | { kind: 'monstre'; id: string; instanceId?: string }
  | { kind: 'boss'; id: string }
  | { kind: 'hero'; id: string }
  | { kind: 'menace'; id: string }
  | { kind: 'destin'; id: string };

interface Store {
  loading: boolean;
  error: string | null;
  design: DesignData | null;
  effects: EffectsCatalog;

  state: GameState | null;
  running: boolean;

  view: View;
  setView: (v: View) => void;

  /** Currently inspected card (modal). */
  inspected: CardRef | null;
  inspect: (c: CardRef | null) => void;

  // Setup form
  form: {
    boss: string;
    heroIds: string[];
    seed: string;
  };

  setBoss: (id: string) => void;
  setHeroAt: (idx: number, id: string) => void;
  addHero: () => void;
  removeHero: () => void;
  setSeed: (s: string) => void;

  load: () => Promise<void>;
  start: () => void;
  replayFromRow: (row: { seed: string; boss: string; heroes: string[] }) => void;
  nextTurn: () => void;
  runToEnd: () => void;
  reset: () => void;
}

const DEFAULT_FORM = {
  boss: 'BOSS_001',
  heroIds: ['HERO_001', 'HERO_003', 'HERO_005'],
  seed: String(Math.floor(Math.random() * 1_000_000)),
};

export const useStore = create<Store>((set, get) => ({
  loading: false,
  error: null,
  design: null,
  effects: {},
  state: null,
  running: false,
  view: 'setup',
  setView: (v) => set({ view: v }),
  inspected: null,
  inspect: (c) => set({ inspected: c }),
  form: { ...DEFAULT_FORM },

  setBoss: (id) => set((s) => ({ form: { ...s.form, boss: id } })),
  setHeroAt: (idx, id) =>
    set((s) => {
      const heroIds = [...s.form.heroIds];
      heroIds[idx] = id;
      return { form: { ...s.form, heroIds } };
    }),
  addHero: () =>
    set((s) => {
      if (s.form.heroIds.length >= 5 || !s.design) return s;
      const all = s.design.heroes.map((h) => h.id);
      const next = all.find((id) => !s.form.heroIds.includes(id)) ?? all[0];
      if (!next) return s;
      return { form: { ...s.form, heroIds: [...s.form.heroIds, next] } };
    }),
  removeHero: () =>
    set((s) => {
      if (s.form.heroIds.length <= 2) return s;
      return { form: { ...s.form, heroIds: s.form.heroIds.slice(0, -1) } };
    }),
  setSeed: (seed) => set((s) => ({ form: { ...s.form, seed } })),

  load: async () => {
    set({ loading: true, error: null });
    try {
      const { design, effects } = await loadAllData();
      set({ design, effects, loading: false });
    } catch (e) {
      set({ loading: false, error: (e as Error).message });
    }
  },

  start: () => {
    const { design, effects, form } = get();
    if (!design) return;
    const seedNum = Number(form.seed);
    const seed = Number.isFinite(seedNum) && form.seed.trim() !== '' ? seedNum : form.seed;
    const state = createGame(design, {
      seed,
      nPlayers: form.heroIds.length,
      bossId: form.boss,
      heroIds: form.heroIds,
      effects,
    });
    set({ state, running: true, view: 'game' });
  },

  /** Replay from batch summary: fill form, run, switch to game view. */
  replayFromRow: (row: { seed: string; boss: string; heroes: string[] }) => {
    const { design, effects } = get();
    if (!design) return;
    const seedNum = Number(row.seed);
    const seed = Number.isFinite(seedNum) && row.seed.trim() !== '' ? seedNum : row.seed;
    const state = createGame(design, {
      seed,
      nPlayers: row.heroes.length,
      bossId: row.boss,
      heroIds: row.heroes,
      effects,
    });
    set({
      state,
      running: true,
      view: 'game',
      form: { boss: row.boss, heroIds: row.heroes, seed: String(seed) },
    });
  },

  nextTurn: () => {
    const { state } = get();
    if (!state || state.result !== 'running') return;
    const policies = state.heroes.map(() => heuristicPolicy);
    runTurn(state, policies);
    // Advance to next seat (mirrors runGame's loop)
    if (state.result === 'running') {
      for (let offset = 1; offset <= state.nPlayers; offset++) {
        const idx = (state.activeSeat + offset) % state.nPlayers;
        const h = state.heroes[idx];
        if (h && !h.dead) {
          state.activeSeat = idx;
          break;
        }
      }
    }
    // Force React update. Clone nested arrays that HeroPanel reads so any
    // memo/shallow-compare downstream sees new references.
    set({
      state: {
        ...state,
        heroes: state.heroes.map((h) =>
          h ? { ...h, hand: [...h.hand], objects: [...h.objects], queue: [...h.queue], wounds: [...h.wounds] } : h,
        ),
        events: [...state.events],
      },
    });
  },

  runToEnd: () => {
    const { state } = get();
    if (!state || state.result !== 'running') return;
    const policies = state.heroes.map(() => heuristicPolicy);
    runGame(state, { policies });
    set({ state: { ...state } });
  },

  reset: () => {
    set({ state: null, running: false, view: 'setup' });
  },
}));

export function totalWoundsOf(wounds: readonly { degats: number }[]): number {
  return wounds.reduce((s, w) => s + w.degats, 0);
}

export function describeEvent(ev: GameEvent, state?: GameState | null): string {
  const design = state?.catalog ? null : null;
  // Helper closures that resolve an id to a name via the state's catalog.
  const chName = (id: string) => state?.catalog.chasseById.get(id)?.nom ?? id;
  const monName = (id: string) => state?.catalog.monstreById.get(id)?.nom ?? id;
  const heroName = (id: string) => state?.catalog.heroesById.get(id)?.nom ?? id;
  const bossNameOf = (id: string) => {
    const b = state?.catalog.bossById.get(id);
    return b ? `${b.nom} (${b.difficulte})` : id;
  };
  const menName = (id: string) => state?.catalog.menaceById.get(id)?.nom ?? id;
  const desName = (id: string) => state?.catalog.destinById.get(id)?.titre ?? id;
  void design;

  switch (ev.kind) {
    case 'SETUP':
      return `Setup boss=${bossNameOf(ev.bossId)} heroes=[${ev.heroes.map(heroName).join(', ')}] hp=${ev.bossHp}`;
    case 'SHUFFLE_PILE':
      return `Shuffle ${ev.pile} (${ev.size})`;
    case 'INITIAL_HAND':
      return `Seat ${ev.seat}: main initiale [${ev.cards.map(chName).join(', ')}]`;
    case 'TURN_START':
      return `— Tour ${ev.turn}, seat ${ev.seat} —`;
    case 'TURN_END':
      return `Fin tour ${ev.turn} (seat ${ev.seat})`;
    case 'PHASE':
      return `Phase: ${ev.phase}`;
    case 'ACTION_DRAW':
      return `Seat ${ev.seat} pioche [${ev.drew.map(chName).join(', ')}]${ev.reason ? ` — ${ev.reason}` : ''}`;
    case 'ACTION_PLAY_ACTION':
      return `Seat ${ev.seat} joue « ${chName(ev.card)} »${ev.renforts.length ? ` + [${ev.renforts.map(chName).join(', ')}]` : ''}${ev.reason ? ` — ${ev.reason}` : ''}`;
    case 'ACTION_PLAY_OBJECT':
      return `Seat ${ev.seat} pose « ${chName(ev.card)} »${ev.reason ? ` — ${ev.reason}` : ''}`;
    case 'ACTION_EXCHANGE':
      return `Seat ${ev.seat} ⇄ seat ${ev.withSeat}: donne [${ev.given.map(chName).join(', ')}] reçoit [${ev.received.map(chName).join(', ')}]${ev.reason ? ` — ${ev.reason}` : ''}`;
    case 'ACTION_NONE':
      return `Seat ${ev.seat}: pas d'action (${ev.reason})`;
    case 'SKIP_TURN':
      return `Seat ${ev.seat}: tour passé (${ev.reason})`;
    case 'ATTACK':
      return `⚔ Attaque → ${describeTgt(ev.tgt, state)} (${ev.degats} 🩸)`;
    case 'DAMAGE':
      return `🩸 ${ev.amount} sur ${describeDamageTarget(ev, state)} (via « ${chName(ev.sourceCardId) || monName(ev.sourceCardId) || menName(ev.sourceCardId) || desName(ev.sourceCardId) || ev.sourceCardId} »)`;
    case 'ELIMINATE_MONSTER':
      return `✸ « ${monName(ev.cardId)} » éliminé (seat ${ev.seat})`;
    case 'HERO_DEATH':
      return `✝ ${state?.heroes[ev.seat] ? heroName(state.heroes[ev.seat]!.heroId) : `seat ${ev.seat}`} meurt`;
    case 'BOSS_DEFEATED':
      return `🏆 ${bossNameOf(ev.bossId)} vaincu !`;
    case 'BOSS_SEQ_ICON':
      return `  Séquence boss : ${ev.icon}`;
    case 'DRAW_MENACE':
      return `  Menace piochée : « ${menName(ev.card)} »`;
    case 'RESOLVE_MENACE':
      return `  Menace « ${menName(ev.card)} » → ${ev.outcome}`;
    case 'SUMMON_MONSTER':
      return `  🐾 Invocation de « ${ev.cardName} » (seat ${ev.seat})`;
    case 'ATTACK_ORDER':
      return `  ⚔ Ordre d'attaque (seat ${ev.seat})${ev.instanceId ? '' : ' — file vide'}`;
    case 'BOSS_ACTIF_TRIGGERED':
      return `  ⚡ Actif de « ${bossNameOf(ev.bossId)} »${ev.implemented ? '' : ' [non codé]'}`;
    case 'DRAW_CARD':
      return `    ${ev.pile} → « ${ev.pile === 'chasse' ? chName(ev.card) : ev.pile === 'monstre' ? monName(ev.card) : ev.pile === 'menace' ? menName(ev.card) : desName(ev.card)} »${ev.toSeat !== undefined ? ` (seat ${ev.toSeat})` : ''}`;
    case 'DISCARD_CARD':
      return `    ↳ défausse ${ev.pile}: « ${ev.pile === 'chasse' ? chName(ev.card) : ev.pile === 'monstre' ? monName(ev.card) : ev.pile === 'menace' ? menName(ev.card) : desName(ev.card)} »`;
    case 'CHOICE_MADE':
      return `  ↳ choix : ${ev.label} (seat ${ev.seat})`;
    case 'CAPACITE_USED':
      return `  ⚡ Capacité de ${heroName(ev.heroId)} (seat ${ev.seat})`;
    case 'OBJECT_USED':
      return `  🛠 Seat ${ev.seat} utilise « ${chName(ev.card)} »${ev.reason ? ` — ${ev.reason}` : ''}`;
    case 'MONSTER_MOVED': {
      const name = state?.catalog.monstreById.get(ev.cardId)?.nom ?? ev.cardId;
      const src = chName(ev.sourceCardId) || monName(ev.sourceCardId) || menName(ev.sourceCardId) || desName(ev.sourceCardId) || bossNameOf(ev.sourceCardId) || ev.sourceCardId;
      if (ev.fromSeat === ev.toSeat) {
        return `  ➤ « ${name} » déplacé en ${ev.position === 'head' ? 'tête' : 'fond'} de sa file (via ${src})`;
      }
      return `  ➤ « ${name} » : seat ${ev.fromSeat} → seat ${ev.toSeat} (${ev.position === 'head' ? 'tête' : 'fond'}) via ${src}`;
    }
    case 'WARN':
      return `⚠ ${ev.message}`;
    case 'NOT_IMPLEMENTED':
      return `✗ pas codé : ${ev.feature}${ev.detail ? ' (' + ev.detail + ')' : ''}`;
    case 'GAME_END':
      return `=== ${ev.result === 'victory' ? 'VICTOIRE' : 'DÉFAITE'} en ${ev.turns} tours · boss hp=${ev.bossHpRemaining} · morts=[${ev.deadHeroes.join(',')}] ===`;
    case 'PILE_RESHUFFLE':
      return `Reshuffle ${ev.pile} (${ev.size})`;
  }
  return JSON.stringify(ev);
}

function describeDamageTarget(ev: { targetKind: string; targetId: string }, state?: GameState | null): string {
  if (ev.targetKind === 'boss') return 'le Colosse';
  if (ev.targetKind === 'hero') {
    const hero = state?.heroes.find((h) => h.heroId === ev.targetId);
    return hero ? state!.catalog.heroesById.get(hero.heroId)?.nom ?? ev.targetId : ev.targetId;
  }
  // Monster: targetId is the instance id — look up cardId.
  if (state) {
    for (const h of state.heroes) {
      const m = h.queue.find((mm) => mm.instanceId === ev.targetId);
      if (m) return state.catalog.monstreById.get(m.cardId)?.nom ?? ev.targetId;
    }
  }
  return ev.targetId;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function describeTgt(t: any, state?: GameState | null): string {
  if (!t) return '?';
  if (t.kind === 'boss') return 'le Colosse';
  if (t.kind === 'hero') {
    const h = state?.heroes[t.seat];
    const name = h && state ? state.catalog.heroesById.get(h.heroId)?.nom : undefined;
    return name ?? `seat ${t.seat}`;
  }
  if (t.kind === 'monster' && state) {
    for (const h of state.heroes) {
      const m = h.queue.find((mm) => mm.instanceId === t.instanceId);
      if (m) return state.catalog.monstreById.get(m.cardId)?.nom ?? t.instanceId;
    }
  }
  return '?';
}
