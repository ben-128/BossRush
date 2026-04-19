/**
 * Pile operations (draw, discard, reshuffle).
 *
 * When `draw` is empty and a draw is requested, the engine shuffles `discard`
 * back into `draw` per the rules:
 * "Chaque fois qu'un effet vous demande de piocher dans une pile vide,
 *  mélangez immédiatement sa défausse associée pour former une nouvelle pioche."
 *
 * If both draw and discard are empty, draw returns undefined (caller decides
 * how to handle — e.g. boss actifs may fire as a result).
 */

import type { GameState, Pile } from './gameState.js';
import type { CarteChasse } from './types.js';
import type { PileName } from './events.js';
import { Rng } from './rng.js';
import { emit } from './logger.js';
import { hookReshuffleHealsBoss } from './bossPassifs.js';

function withRng<T>(state: GameState, fn: (rng: Rng) => T): T {
  const rng = Rng.fromState(state.rngState);
  const result = fn(rng);
  state.rngState = rng.state;
  return result;
}

/** Ensure a pile can provide one draw by reshuffling its discard if needed. */
function ensureDrawable<T>(state: GameState, pile: Pile<T>, name: PileName): void {
  if (pile.draw.length > 0 || pile.discard.length === 0) return;
  const reshuffled = withRng(state, (rng) => rng.shuffle(pile.discard));
  pile.draw = reshuffled;
  pile.discard = [];
  emit(state, { kind: 'PILE_RESHUFFLE', pile: name, size: pile.draw.length });
  hookReshuffleHealsBoss(state, name);
}

/** Draw one card from a named pile. Returns undefined if both stacks empty. */
export function drawOne<T>(state: GameState, pile: Pile<T>, name: PileName): T | undefined {
  ensureDrawable(state, pile, name);
  return pile.draw.shift();
}

/** Draw up to n cards. Returns however many were available. */
export function drawN<T>(state: GameState, pile: Pile<T>, name: PileName, n: number): T[] {
  const out: T[] = [];
  for (let i = 0; i < n; i++) {
    const c = drawOne(state, pile, name);
    if (c === undefined) break;
    out.push(c);
  }
  return out;
}

/** Append a card to the discard. */
export function discard<T>(pile: Pile<T>, card: T): void {
  pile.discard.push(card);
}

/** Shuffle a pile's draw in place using the state's RNG. */
export function shufflePile<T>(state: GameState, pile: Pile<T>): void {
  const shuffled = withRng(state, (rng) => rng.shuffle(pile.draw));
  pile.draw = shuffled;
}

// ---------------------------------------------------------------------------
// Per-hero Chasse helpers (rules refactor 2026-04)
// ---------------------------------------------------------------------------
// Per the official rules, each hero has their own 20-card Chasse deck and
// their own discard. All draws route to the seat doing the drawing; all
// discards route to the card's original owner (identified by its `prerequis`
// matching a hero's `nom`). Cards with no prereq fall back to the active
// seat's discard.

/** Return the Chasse deck/discard pile owned by a given seat. */
export function heroChasseDeck(state: GameState, seat: number): Pile<CarteChasse> | undefined {
  return state.heroes[seat]?.deck;
}

/** Draw one Chasse card from the owner's personal deck. */
export function drawChasseFor(state: GameState, seat: number): CarteChasse | undefined {
  const deck = heroChasseDeck(state, seat);
  if (!deck) return undefined;
  return drawOne(state, deck, 'chasse');
}

/**
 * Route a chasse card to its owning hero's discard (owner = hero whose `nom`
 * matches the card's `prerequis`). Falls back to the provided `fallbackSeat`'s
 * discard if the owner can't be resolved (card has no prereq, or owning hero
 * isn't in this game).
 */
export function discardChasse(
  state: GameState,
  card: CarteChasse,
  fallbackSeat: number,
): void {
  if (card.prerequis) {
    for (const h of state.heroes) {
      const nom = state.catalog.heroesById.get(h.heroId)?.nom;
      if (nom === card.prerequis) {
        h.deck.discard.push(card);
        return;
      }
    }
  }
  const fb = state.heroes[fallbackSeat];
  if (fb) fb.deck.discard.push(card);
}
