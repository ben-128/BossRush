/**
 * Heuristic policy (V1 per plan §12).
 *
 * Decision priority on each turn:
 *   1. If critical (wounds >= vie - 1), try to heal via capacité OR heal
 *      objet posé OR a reactive_heal object / action.
 *   2. If capacité spéciale is "ready" and situationally useful (tag match),
 *      fire it.
 *   3. If at least one Action card is playable, play the highest-damage one
 *      (with available renforts).
 *   4. If hand < 2, draw.
 *   5. Otherwise, play any playable action; else draw.
 *
 * Choice op decisions aim for survival:
 *   - Prefer options without `damage` to active hero.
 *   - Prefer options with `heal` or `draw`.
 *   - Tie-break: first option.
 *
 * Target picks for `any_hero` / `any_ally` prioritize the most wounded.
 *
 * The heuristic is intentionally simple — see plan §12.3: correctness >
 * optimality. As long as it's stable, comparisons across configs stay valid.
 */

import type { GameState, HeroRuntime } from '../engine/gameState.js';
import type { PlayerAction } from '../engine/actions.js';
import type { CarteChasse } from '../engine/types.js';
import type { Policy } from './policy.js';
import {
  isActionPlayable,
  isObjetPlayableRenfort,
  meetsPrerequisite,
} from '../engine/actions.js';

function totalWounds(h: HeroRuntime): number {
  return h.wounds.reduce((s, w) => s + w.degats, 0);
}

function hpRemaining(h: HeroRuntime): number {
  return h.vieMax - totalWounds(h);
}

function mostWoundedSeat(state: GameState): number | undefined {
  let best: HeroRuntime | undefined;
  let worst = -1;
  for (const h of state.heroes) {
    if (h.dead) continue;
    const w = totalWounds(h);
    if (w > worst) {
      worst = w;
      best = h;
    }
  }
  return best?.seatIdx;
}

function playableActions(state: GameState, h: HeroRuntime): number[] {
  const out: number[] = [];
  h.hand.forEach((c, i) => {
    if (isActionPlayable(state, c) && meetsPrerequisite(h, c, state)) out.push(i);
  });
  return out;
}

function renfortIndices(state: GameState, h: HeroRuntime): number[] {
  const out: number[] = [];
  h.objects.forEach((c, i) => {
    if (isObjetPlayableRenfort(state, c)) out.push(i);
  });
  return out;
}

/** Score an action card: prioritise damage + situational bonuses. */
function scoreAction(state: GameState, h: HeroRuntime, c: CarteChasse): number {
  let score = 0;
  // Damage component.
  score += (c.degats ?? 0) * 10;
  // DSL entry bonus based on tag.
  const entry = state.effects[c.id];
  if (entry?.tag) {
    switch (entry.tag) {
      case 'attack_free_target':
        score += 5;
        break;
      case 'boss_only_burst':
        // Excellent when we can otherwise not reach the boss (file non-vide).
        score += h.queue.length > 0 ? 12 : 2;
        break;
      case 'attack_cantrip':
      case 'attack_sustain':
      case 'attack_support':
      case 'attack_support_aoe':
        score += 3;
        break;
      case 'draw_engine':
      case 'draw_aoe':
        score += h.hand.length < 3 ? 8 : 2;
        break;
      case 'aoe_heal':
      case 'burst_heal':
        // Value scales with total injuries on party.
        for (const hh of state.heroes) if (!hh.dead) score += totalWounds(hh) * 2;
        break;
      case 'attack_conditional':
        // SOI_A02: only if no ally wounded — big value when the require holds.
        const anyAllyHurt = state.heroes.some(
          (hh) => !hh.dead && hh.seatIdx !== h.seatIdx && totalWounds(hh) > 0,
        );
        score += anyAllyHurt ? -5 : 8;
        break;
    }
  }
  return score;
}

/** Decide whether and how to use the hero's capacité spéciale. */
function shouldUseCapacite(state: GameState, h: HeroRuntime): boolean {
  if (h.capaciteUsed) return false;
  const entry = state.effects[h.heroId];
  if (!entry) return false;
  switch (entry.tag) {
    case 'reactive_heal':
      // Gao: heal all wounds of most wounded. Fire if someone has 3+ wounds.
      return state.heroes.some((hh) => !hh.dead && totalWounds(hh) >= 3);
    case 'elim_on_demand':
      // Daraa: eliminate all wounded monsters. Fire if ≥ 2 wounded monsters.
      {
        let count = 0;
        for (const hh of state.heroes) {
          for (const m of hh.queue) {
            if (m.wounds.length > 0) count++;
          }
        }
        return count >= 2;
      }
    case 'prevent_lethal':
      // Nawel: cancel all damage this turn. Fire if self is at risk of dying
      // this turn (wounds >= vie - 1).
      return totalWounds(h) >= h.vieMax - 1;
    default:
      return false;
  }
}

export const heuristicPolicy: Policy = {
  name: 'heuristic',

  pickAction(state: GameState): PlayerAction {
    const seat = state.activeSeat;
    const h = state.heroes[seat];
    if (!h) return { kind: 'none', reason: 'no hero' };

    // 1. Fire capacité if situation warrants.
    if (shouldUseCapacite(state, h)) return { kind: 'useCapacite' };

    // 2. Evaluate playable actions.
    const playable = playableActions(state, h);
    if (playable.length > 0) {
      const scored = playable
        .map((i) => ({ i, card: h.hand[i]!, s: scoreAction(state, h, h.hand[i]!) }))
        .sort((a, b) => b.s - a.s);
      const best = scored[0]!;
      // Attach renforts if this is an attack and renforts exist (one at most).
      const renforts = renfortIndices(state, h);
      const attaches: number[] = [];
      if (best.card.degats !== undefined && renforts.length > 0 && renforts[0] !== undefined) {
        attaches.push(renforts[0]);
      }
      return { kind: 'play', playAction: best.i, renforts: attaches };
    }

    // 3. No action playable → draw.
    return { kind: 'draw' };
  },

  pickChoice(state, sourceSeat, _sourceCardId, options) {
    // Heuristic: pick option whose label suggests safety/benefit.
    const h = state.heroes[sourceSeat];
    const selfDamage = h ? totalWounds(h) : 0;
    // Preference order by keyword in label (first match wins).
    const badKeywords = ['encaisser', 'subir', 'tout_donner', 'defausser', 'accepter'];
    const goodKeywords = ['soigner', 'piocher', 'souffler', 'rester_concentre', 'tenir_bon', 'allie_defausse'];

    // If dangerously low, avoid anything that might damage.
    if (h && selfDamage >= h.vieMax - 1) {
      for (let i = 0; i < options.length; i++) {
        const label = options[i]!.label.toLowerCase();
        if (!badKeywords.some((k) => label.includes(k))) return i;
      }
    }
    // Prefer a "good" keyword.
    for (let i = 0; i < options.length; i++) {
      const label = options[i]!.label.toLowerCase();
      if (goodKeywords.some((k) => label.includes(k))) return i;
    }
    return 0;
  },

  pickHeroTarget(state, _sourceSeat, candidates) {
    // Pick the most wounded among candidates.
    const mw = mostWoundedSeat(state);
    if (mw !== undefined && candidates.includes(mw)) {
      return candidates.indexOf(mw);
    }
    return 0;
  },

  pickMonsterTarget(_state, _sourceSeat, candidates) {
    // Pick any — return first.
    return candidates.length > 0 ? 0 : 0;
  },
};
