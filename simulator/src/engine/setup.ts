/**
 * Game setup: build the initial GameState from a DesignData + options.
 *
 * Follows the official setup sequence (see REGLES_RESUME.md § Mise en place):
 *  1. Boss chosen, PV = multiplier × nPlayers
 *  2. Menace pile (30 generic cards) shuffled
 *  3. Monstre + Destin piles built from catalog, shuffled
 *  4. Each hero assigned; each hero's 20-card Chasse packet contributes to
 *     a single shared Chasse pile per the rules (N heroes × 20 cards).
 *  5. Each player draws 3 cards initial hand.
 *
 * "Échanges libres avant de commencer" (setup step 8) is NOT performed here —
 * the random AI never exchanges, and exchanges will be plugged in when
 * Diplomate-style heuristics are implemented.
 */

import type { DesignData, CarteChasse, Monstre } from './types.js';
import type {
  BossRuntime,
  DesignCatalog,
  GameState,
  HeroRuntime,
} from './gameState.js';
import type { EffectsCatalog } from './effectTypes.js';
import { Rng } from './rng.js';
import { emit } from './logger.js';
import { shufflePile } from './piles.js';

export interface SetupOptions {
  seed: number | string;
  nPlayers: number;
  bossId: string;
  heroIds: string[]; // length === nPlayers
  turnCap?: number;  // default 200
  /** Effect DSL annotations. Defaults to empty (raw-damage fallback). */
  effects?: EffectsCatalog;
}

export class SetupError extends Error {}

export function buildCatalog(data: DesignData): DesignCatalog {
  return {
    heroesById: new Map(data.heroes.map((h) => [h.id, h])),
    bossById: new Map(data.boss.map((b) => [b.id, b])),
    chasseById: new Map(data.cartesChasse.map((c) => [c.id, c])),
    monstreById: new Map(data.monstres.map((m) => [m.id, m])),
    menaceById: new Map(data.menaces.map((m) => [m.id, m])),
    destinById: new Map(data.destins.map((d) => [d.id, d])),
  };
}

/** Expand a quantity-based card list into a flat deck respecting `quantite`. */
function expandByQuantity<T extends { id: string; quantite: number }>(
  cards: ReadonlyArray<T>,
): T[] {
  const out: T[] = [];
  for (const c of cards) {
    for (let i = 0; i < c.quantite; i++) out.push(c);
  }
  return out;
}

export function createGame(data: DesignData, options: SetupOptions): GameState {
  const { seed, nPlayers, bossId, heroIds } = options;
  const turnCap = options.turnCap ?? 200;

  if (nPlayers < 2 || nPlayers > 5) {
    throw new SetupError(`nPlayers must be in [2, 5], got ${nPlayers}`);
  }
  if (heroIds.length !== nPlayers) {
    throw new SetupError(
      `heroIds.length (${heroIds.length}) must equal nPlayers (${nPlayers})`,
    );
  }
  if (new Set(heroIds).size !== heroIds.length) {
    throw new SetupError(`heroIds must be unique; got ${heroIds.join(', ')}`);
  }

  const catalog = buildCatalog(data);
  const bossCard = catalog.bossById.get(bossId);
  if (!bossCard) throw new SetupError(`Unknown boss: ${bossId}`);

  // --- Boss runtime ---
  const bossRt: BossRuntime = {
    bossId,
    vieMax: bossCard.vie_multiplicateur * nPlayers,
    wounds: [],
    defeated: false,
  };

  // --- Hero runtimes (no hand yet, filled below) ---
  const heroes: HeroRuntime[] = heroIds.map((hid, seat) => {
    const h = catalog.heroesById.get(hid);
    if (!h) throw new SetupError(`Unknown hero: ${hid}`);
    return {
      seatIdx: seat,
      heroId: hid,
      vieMax: h.vie,
      wounds: [],
      hand: [],
      objects: [],
      capaciteUsed: false,
      dead: false,
      queue: [],
    };
  });

  // --- Chasse pile: sum of selected heroes' packets (by prerequis) ---
  const selectedHeroNames = new Set(
    heroIds.map((hid) => catalog.heroesById.get(hid)!.nom),
  );
  const chassePacket: CarteChasse[] = expandByQuantity(
    data.cartesChasse.filter((c) => selectedHeroNames.has(c.prerequis)),
  );

  // --- Monstre / Destin / Menace piles from catalog (no selection filter) ---
  const monstrePacket: Monstre[] = expandByQuantity(data.monstres);
  // Menaces and Destins: JSON does not carry `quantite`, treat as 1 each.
  const menacePacket = [...data.menaces];
  const destinPacket = [...data.destins];

  // --- Build initial state with empty piles, then shuffle ---
  const state: GameState = {
    seed,
    rngState: new Rng(seed).state, // bootstrap
    nPlayers,
    activeSeat: 0,
    turn: 0,
    phase: 'HERO_ACTION',
    result: 'running',
    heroes,
    boss: bossRt,
    piles: {
      chasse: { draw: chassePacket, discard: [] },
      menace: { draw: menacePacket, discard: [] },
      monstre: { draw: monstrePacket, discard: [] },
      destin: { draw: destinPacket, discard: [] },
    },
    events: [],
    counters: { wound: 0, monsterInstance: 0, event: 0 },
    turnCap,
    catalog,
    effects: options.effects ?? {},
    modifiers: [],
    policies: [],
  };

  // --- Shuffle all piles (deterministic via seed) ---
  shufflePile(state, state.piles.chasse);
  emit(state, { kind: 'SHUFFLE_PILE', pile: 'chasse', size: state.piles.chasse.draw.length });
  shufflePile(state, state.piles.menace);
  emit(state, { kind: 'SHUFFLE_PILE', pile: 'menace', size: state.piles.menace.draw.length });
  shufflePile(state, state.piles.monstre);
  emit(state, { kind: 'SHUFFLE_PILE', pile: 'monstre', size: state.piles.monstre.draw.length });
  shufflePile(state, state.piles.destin);
  emit(state, { kind: 'SHUFFLE_PILE', pile: 'destin', size: state.piles.destin.draw.length });

  // --- Emit SETUP before dealing hands so the log is well ordered ---
  // (SETUP first, then SHUFFLE events — easier to read. Move SETUP emission up
  // before shuffles.) Actually we've already emitted shuffles; push SETUP at
  // index 0 by prepending to the array.
  state.events.unshift({
    t: 0, // re-numbered below
    kind: 'SETUP',
    seed,
    nPlayers,
    bossId,
    heroes: [...heroIds],
    bossHp: bossRt.vieMax,
  });
  // Renumber all events so t starts at 1 and is dense.
  state.events.forEach((ev, i) => {
    ev.t = i + 1;
  });
  state.counters.event = state.events.length;

  // --- Deal initial hands: each player draws 3 Chasse cards ---
  for (const h of state.heroes) {
    const drawn: CarteChasse[] = [];
    for (let i = 0; i < 3; i++) {
      const c = state.piles.chasse.draw.shift();
      if (!c) break;
      drawn.push(c);
    }
    h.hand.push(...drawn);
    emit(state, {
      kind: 'INITIAL_HAND',
      seat: h.seatIdx,
      cards: drawn.map((c) => c.id),
    });
  }

  return state;
}
