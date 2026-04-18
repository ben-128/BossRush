/**
 * Top-level engine: run a full turn, run a whole game.
 *
 * A turn goes through the phases HERO_ACTION → BOSS_SEQUENCE → (next seat).
 * Capacité Spéciale usage is NOT in J2 and will slot in later (see §12 of
 * the plan).
 *
 * The engine exits early if result !== 'running' at any point.
 *
 * A turnCap (default 200) guards against runaway simulations — reaching it
 * ends the game as a defeat with a specific WARN event.
 */

import type { GameState } from './gameState.js';
import type { Policy } from '../ai/policy.js';
import { applyPlayerAction } from './actions.js';
import { resolveBossSequence } from './bossSequence.js';
import { emit } from './logger.js';
import { clearScope } from './modifiers.js';
import {
  hookBossBeforeHeroes,
  hookHandCapAtEndOfTurn,
  resetPerTurnFlags,
  hookAkkoroDamageDiscardsChasse,
} from './bossPassifs.js';
import { addModifier } from './modifiers.js';

export interface RunOptions {
  /** One policy per seat. Length must match nPlayers. */
  policies: Policy[];
  /** Console-log events as they happen (for manual debugging). */
  verbose?: boolean;
}

/** Advance the active seat clockwise, skipping dead heroes. */
function advanceSeat(state: GameState): void {
  for (let offset = 1; offset <= state.nPlayers; offset++) {
    const idx = (state.activeSeat + offset) % state.nPlayers;
    const h = state.heroes[idx];
    if (h && !h.dead) {
      state.activeSeat = idx;
      return;
    }
  }
  // No living hero — defeat should already be set.
}

export function runTurn(state: GameState, policies: Policy[]): void {
  if (state.result !== 'running') return;
  // Stash policies on state so effect handlers can consult them (choice op,
  // target picks). Overwritten at each turn to reflect caller choice.
  state.policies = policies;

  const seat = state.activeSeat;
  const hero = state.heroes[seat];
  if (!hero || hero.dead) {
    emit(state, { kind: 'SKIP_TURN', seat, reason: 'hero_dead' });
    return;
  }

  state.turn += 1;
  resetPerTurnFlags(state);
  // Reset per-turn counters on the active hero only (scoped to whose turn it is).
  hero.actionsPlayedThisTurn = 0;
  hero.drawsThisTurn = 0;
  hero.actionKillsThisTurn = 0;
  state.healedThisTurn = false;
  // Install boss passif modifiers for this turn (thisTurn-scoped; they auto
  // re-install at the start of every turn).
  const bossEntry = state.effects[state.boss.bossId];
  if (bossEntry?.passif_modifiers) {
    for (const pm of bossEntry.passif_modifiers) {
      addModifier(state, pm.effect, pm.scope, state.boss.bossId);
    }
  }
  emit(state, { kind: 'TURN_START', turn: state.turn, seat });

  const bossFirst = hookBossBeforeHeroes(state);

  const heroPhase = () => {
    state.phase = 'HERO_ACTION';
    emit(state, { kind: 'PHASE', phase: 'HERO_ACTION' });
    const policy = policies[seat];
    if (!policy) {
      emit(state, { kind: 'SKIP_TURN', seat, reason: 'no_policy' });
    } else {
      if (policy.pickReaction) {
        const pre = policy.pickReaction(state);
        if (pre) applyPlayerAction(state, pre);
      }
      const action = policy.pickAction(state);
      applyPlayerAction(state, action);
      if (policy.pickReaction && state.result === 'running') {
        const post = policy.pickReaction(state);
        if (post) applyPlayerAction(state, post);
      }
    }
  };
  const bossPhase = () => {
    state.phase = 'BOSS_SEQUENCE';
    emit(state, { kind: 'PHASE', phase: 'BOSS_SEQUENCE' });
    resolveBossSequence(state);
  };

  if (bossFirst) {
    bossPhase();
    if (state.result !== 'running') return;
    heroPhase();
  } else {
    heroPhase();
    if (state.result !== 'running') return;
    bossPhase();
  }

  hookAkkoroDamageDiscardsChasse(state);
  hookHandCapAtEndOfTurn(state);
  // Clear modifiers with 'thisTurn' scope at turn end.
  clearScope(state, 'thisTurn');
  // One-shot per-turn flags on heroes.
  for (const hh of state.heroes) {
    if (hh.extraPoseAvailable) hh.extraPoseAvailable = false;
    if (hh.onlyDrawThisTurn) hh.onlyDrawThisTurn = false;
  }
  emit(state, { kind: 'TURN_END', turn: state.turn, seat });
}

/** Run until victory, defeat, or turnCap reached. */
export function runGame(state: GameState, options: RunOptions): void {
  while (state.result === 'running') {
    if (state.turn >= state.turnCap) {
      emit(state, {
        kind: 'WARN',
        message: `Turn cap (${state.turnCap}) reached — forcing defeat`,
      });
      state.result = 'defeat';
      state.phase = 'GAME_END';
      break;
    }
    runTurn(state, options.policies);
    if (state.result !== 'running') break;
    advanceSeat(state);
  }

  const deadSeats = state.heroes.filter((h) => h.dead).map((h) => h.seatIdx);
  const bossHpRemaining = Math.max(
    0,
    state.boss.vieMax - state.boss.wounds.reduce((s, w) => s + w.degats, 0),
  );
  emit(state, {
    kind: 'GAME_END',
    result: state.result === 'victory' ? 'victory' : 'defeat',
    turns: state.turn,
    bossHpRemaining,
    deadHeroes: deadSeats,
  });

  if (options.verbose) {
    for (const ev of state.events) {
      // eslint-disable-next-line no-console
      console.log(JSON.stringify(ev));
    }
  }
}
