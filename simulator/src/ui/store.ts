import { create } from 'zustand';
import type { DesignData } from '../engine/types.js';
import type { EffectsCatalog } from '../engine/effectTypes.js';
import type { GameState } from '../engine/gameState.js';
import type { GameEvent } from '../engine/events.js';
import { createGame } from '../engine/setup.js';
import { runTurn, runGame } from '../engine/engine.js';
import { randomPolicy } from '../ai/random.js';
import { loadAllData } from './browserLoader.js';

export type View = 'setup' | 'game' | 'batch' | 'dashboard';

interface Store {
  loading: boolean;
  error: string | null;
  design: DesignData | null;
  effects: EffectsCatalog;

  state: GameState | null;
  running: boolean;

  view: View;
  setView: (v: View) => void;

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
  seed: '42',
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
    const policies = state.heroes.map(() => randomPolicy);
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
    // Force React update by producing a shallow clone reference.
    set({ state: { ...state } });
  },

  runToEnd: () => {
    const { state } = get();
    if (!state || state.result !== 'running') return;
    const policies = state.heroes.map(() => randomPolicy);
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

export function describeEvent(ev: GameEvent): string {
  switch (ev.kind) {
    case 'SETUP':
      return `Setup boss=${ev.bossId} heroes=${ev.heroes.join(',')} hp=${ev.bossHp}`;
    case 'SHUFFLE_PILE':
      return `Shuffle ${ev.pile} (${ev.size})`;
    case 'INITIAL_HAND':
      return `Seat ${ev.seat} draws initial hand: ${ev.cards.join(', ')}`;
    case 'TURN_START':
      return `— Turn ${ev.turn}, seat ${ev.seat} —`;
    case 'TURN_END':
      return `End turn ${ev.turn} (seat ${ev.seat})`;
    case 'PHASE':
      return `Phase: ${ev.phase}`;
    case 'ACTION_DRAW':
      return `Seat ${ev.seat} draws: ${ev.drew.join(', ')}`;
    case 'ACTION_PLAY_ACTION':
      return `Seat ${ev.seat} plays ${ev.card}${ev.renforts.length ? ` + [${ev.renforts.join(',')}]` : ''}`;
    case 'ACTION_PLAY_OBJECT':
      return `Seat ${ev.seat} places object ${ev.card}`;
    case 'ACTION_EXCHANGE':
      return `Seat ${ev.seat} ⇄ ${ev.withSeat}: gives [${ev.given.join(',')}] takes [${ev.received.join(',')}]`;
    case 'ACTION_NONE':
      return `Seat ${ev.seat}: no action (${ev.reason})`;
    case 'SKIP_TURN':
      return `Seat ${ev.seat}: skip (${ev.reason})`;
    case 'ATTACK':
      return `Attack → ${describeTgt(ev.tgt)} for ${ev.degats}`;
    case 'DAMAGE':
      return `Damage ${ev.amount} on ${ev.targetKind}:${ev.targetId} (from ${ev.sourceCardId})`;
    case 'ELIMINATE_MONSTER':
      return `✸ Monster ${ev.cardId} (${ev.instanceId}) eliminated (seat ${ev.seat})`;
    case 'HERO_DEATH':
      return `✝ Hero at seat ${ev.seat} dies`;
    case 'BOSS_DEFEATED':
      return `🏆 Boss ${ev.bossId} defeated`;
    case 'BOSS_SEQ_ICON':
      return `  Boss seq: ${ev.icon}`;
    case 'DRAW_MENACE':
      return `  Menace drawn: ${ev.card} ${ev.name}`;
    case 'RESOLVE_MENACE':
      return `  Menace ${ev.card} → ${ev.outcome}`;
    case 'SUMMON_MONSTER':
      return `  🐾 Summon ${ev.cardName} (${ev.instanceId}) to seat ${ev.seat}`;
    case 'ATTACK_ORDER':
      return `  ⚔ Attack order (seat ${ev.seat}) → ${ev.instanceId ?? 'empty queue'}`;
    case 'BOSS_ACTIF_TRIGGERED':
      return `  ⚡ Boss actif (${ev.bossId}) ${ev.implemented ? '' : '[not coded]'}`;
    case 'DRAW_CARD':
      return `    ${ev.pile} → ${ev.card}${ev.toSeat !== undefined ? ` (seat ${ev.toSeat})` : ''}`;
    case 'DISCARD_CARD':
      return `    ↳ discard ${ev.pile}:${ev.card}`;
    case 'WARN':
      return `⚠ ${ev.message}`;
    case 'NOT_IMPLEMENTED':
      return `✗ not coded: ${ev.feature}${ev.detail ? ' (' + ev.detail + ')' : ''}`;
    case 'GAME_END':
      return `=== GAME ${ev.result.toUpperCase()} in ${ev.turns} turns, boss hp=${ev.bossHpRemaining}, dead heroes=[${ev.deadHeroes.join(',')}] ===`;
    case 'PILE_RESHUFFLE':
      return `Reshuffle ${ev.pile} (${ev.size})`;
  }
  // TS exhaustiveness safety net
  return JSON.stringify(ev);
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function describeTgt(t: any): string {
  if (!t) return '?';
  if (t.kind === 'boss') return 'BOSS';
  if (t.kind === 'hero') return `hero seat${t.seat}`;
  if (t.kind === 'monster') return `mon ${t.instanceId}(seat${t.seat})`;
  return '?';
}
