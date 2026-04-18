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
  const bypass = ignorePrereqObjectIdx(state, h) !== -1;
  h.hand.forEach((c, i) => {
    if (!isActionPlayable(state, c)) return;
    if (bypass) {
      out.push(i);
      return;
    }
    if (meetsPrerequisite(h, c, state)) out.push(i);
  });
  return out;
}

function renfortIndices(state: GameState, h: HeroRuntime): number[] {
  // Only attach objects that actually do something when used as renfort.
  // These run their DSL ops BEFORE the main attack (via playAction's renfort
  // loop) — either via `bonus_degats` directly or by setting modifiers /
  // flags (chain-on-kill, ignore prereq) that the attack then reads.
  const out: number[] = [];
  h.objects.forEach((c, i) => {
    if (!isObjetPlayableRenfort(state, c)) return;
    const tag = state.effects[c.id]?.tag;
    const isBoost =
      (c.bonus_degats ?? 0) > 0 ||
      tag === 'boost_attack' ||
      tag === 'boost_attack_aoe' ||
      tag === 'attack_chain' ||
      tag === 'ignore_prereq';
    if (isBoost) out.push(i);
  });
  return out;
}

/** Index (in `h.objects`) of a posed `ignore_prereq` objet, if any. */
function ignorePrereqObjectIdx(state: GameState, h: HeroRuntime): number {
  return h.objects.findIndex((c) => state.effects[c.id]?.tag === 'ignore_prereq');
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
      case 'burst_heal': {
        // Value scales with total injuries on party. Actively penalise when
        // nobody is wounded so the AI never wastes a heal.
        let partyW = 0;
        for (const hh of state.heroes) if (!hh.dead) partyW += totalWounds(hh);
        score += partyW === 0 ? -20 : partyW * 2;
        break;
      }
      case 'attack_conditional':
        // SOI_A02: only if no ally wounded — big value when the require holds.
        const anyAllyHurt = state.heroes.some(
          (hh) => !hh.dead && hh.seatIdx !== h.seatIdx && totalWounds(hh) > 0,
        );
        score += anyAllyHurt ? -5 : 8;
        break;
      case 'shift_damage':
        // MAG_A06 « Transfert de cendres »: only useful if the hero is
        // actually wounded (otherwise it's a no-op).
        score += totalWounds(h) > 0 ? 6 : -20;
        break;
      case 'rally_monsters': {
        // DIP_A12 « Ralliement tactique »: useless if no monster in play.
        const anyMonster = state.heroes.some((hh) => hh.queue.length > 0);
        score += anyMonster ? 4 : -20;
        break;
      }
      case 'revive': {
        // SOI_A06: only useful if a hero is actually dead.
        const anyDead = state.heroes.some((hh) => hh.dead);
        score += anyDead ? 15 : -20;
        break;
      }
      case 'reassign_attack': {
        // DIP_A10: redirect a monster head to the boss — needs a monster.
        const anyMonster = state.heroes.some((hh) => hh.queue.length > 0);
        score += anyMonster ? 8 : -10;
        break;
      }
      case 'utility_eliminate': {
        // Elimination of a monster — valuable if monsters exist.
        const anyMonster = state.heroes.some((hh) => hh.queue.length > 0);
        score += anyMonster ? 7 : -15;
        break;
      }
      case 'regen_capacity':
        // Only useful if this hero's capacité is spent.
        score += h.capaciteUsed ? 5 : -10;
        break;
      case 'play_more_actions':
        score += 4;
        break;
      case 'sustain_draw':
        score += h.hand.length < 3 ? 5 : 1;
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
      // Gao: heal all wounds of most wounded. Fire if someone has 2+ wounds.
      return state.heroes.some((hh) => !hh.dead && totalWounds(hh) >= 2);
    case 'elim_on_demand': {
      // Daraa: eliminate all wounded monsters. Fire as soon as at least one
      // wounded monster is in play (free removal — no point hoarding).
      for (const hh of state.heroes) {
        for (const m of hh.queue) {
          if (m.wounds.length > 0) return true;
        }
      }
      return false;
    }
    case 'prevent_lethal': {
      // Nawel: cancel all damage this turn. Fire if self is seriously at
      // risk (≤ 2 HP left) OR already wounded with a monster in our queue
      // ready to hit.
      if (totalWounds(h) >= h.vieMax - 2) return true;
      if (totalWounds(h) >= 2 && h.queue.length > 0) return true;
      return false;
    }
    case 'play_more_actions': {
      // Isonash: play 2 extra actions immediately. Fire with ≥ 2 plays in
      // hand — the capacité slot stays mostly used.
      return playableActions(state, h).length >= 2;
    }
    case 'global_buff': {
      // Aslan: free-exchange window for everyone (not just self ↔ ally).
      // Count hero-pairs (i<j) where both sides hold a card whose prereq
      // matches the other — i.e. a mutually-beneficial trade is possible.
      // Fire if ≥ 2 such pairs exist; in a 2-hero game, ≥ 1 is enough.
      const living = state.heroes.filter((hh) => !hh.dead);
      if (living.length < 2) return false;
      const nomOf = (hh: HeroRuntime) => state.catalog.heroesById.get(hh.heroId)?.nom;
      let pairs = 0;
      for (let i = 0; i < living.length; i++) {
        for (let j = i + 1; j < living.length; j++) {
          const a = living[i]!;
          const b = living[j]!;
          const na = nomOf(a);
          const nb = nomOf(b);
          if (!na || !nb) continue;
          const aForB = a.hand.some((c) => c.prerequis === nb);
          const bForA = b.hand.some((c) => c.prerequis === na);
          if (aForB && bForA) pairs++;
        }
      }
      const threshold = living.length <= 2 ? 1 : 2;
      return pairs >= threshold;
    }
    default:
      return false;
  }
}

/**
 * Look for a beneficial exchange with an ally.
 *
 * Mutual fit: I give cards whose `prerequis` matches the ally's name (they
 * can use them) and take cards whose `prerequis` matches mine. Only suggest
 * an exchange when BOTH sides place at least one card in better hands.
 */
function tryExchange(
  state: GameState,
  h: HeroRuntime,
): { withSeat: number; give: number[]; take: number[] } | undefined {
  const myNom = state.catalog.heroesById.get(h.heroId)?.nom;
  if (!myNom) return undefined;

  let best: { withSeat: number; give: number[]; take: number[]; gain: number } | undefined;
  for (const ally of state.heroes) {
    if (ally.dead || ally.seatIdx === h.seatIdx) continue;
    const allyNom = state.catalog.heroesById.get(ally.heroId)?.nom;
    if (!allyNom) continue;

    const give: number[] = [];
    h.hand.forEach((c, i) => {
      if (c.prerequis === allyNom && c.prerequis !== myNom) give.push(i);
    });
    const take: number[] = [];
    ally.hand.forEach((c, i) => {
      if (c.prerequis === myNom && c.prerequis !== allyNom) take.push(i);
    });
    if (give.length === 0 || take.length === 0) continue;

    // Keep sizes equal so hand sizes stay stable; cap at 3 to avoid huge swaps.
    const n = Math.min(give.length, take.length, 3);
    const pair = { withSeat: ally.seatIdx, give: give.slice(0, n), take: take.slice(0, n), gain: n };
    if (!best || pair.gain > best.gain) best = pair;
  }
  if (!best) return undefined;
  return { withSeat: best.withSeat, give: best.give, take: best.take };
}

export const heuristicPolicy: Policy = {
  name: 'heuristic',

  /** Reactive trigger: use capacité or a posed object when situationally valuable. */
  pickReaction(state: GameState): PlayerAction | null {
    const h = state.heroes[state.activeSeat];
    if (!h) return null;

    // Priority 0: free extra object pose (ROD_A04 « Tir de couverture »).
    if (h.extraPoseAvailable) {
      const poseIdx = h.hand.findIndex(
        (c) => c.categorie === 'objet' && meetsPrerequisite(h, c, state),
      );
      if (poseIdx !== -1) {
        h.extraPoseAvailable = false;
        return {
          kind: 'play',
          placeObject: poseIdx,
          reason: `pose bonus via Tir de couverture`,
        };
      }
    }

    // Priority 1: capacité spéciale.
    if (!h.capaciteUsed && shouldUseCapacite(state, h)) {
      const entry = state.effects[h.heroId];
      return {
        kind: 'useCapacite',
        reason: `capacité "${entry?.tag ?? 'spéciale'}" contextuellement utile`,
      };
    }

    // Posed objects are purely reactive now — they fire on engine events
    // (see src/engine/reactiveObjects.ts). No active "use" decision here.
    return null;
  },

  pickAction(state: GameState): PlayerAction {
    const seat = state.activeSeat;
    const h = state.heroes[seat];
    if (!h) return { kind: 'none', reason: 'no hero' };

    // Evaluate playable actions.
    const playable = playableActions(state, h);
    if (playable.length > 0) {
      const scored = playable
        .map((i) => ({ i, card: h.hand[i]!, s: scoreAction(state, h, h.hand[i]!) }))
        .sort((a, b) => b.s - a.s);
      const best = scored[0]!;
      // If the best option actively scores negative, it's worse than doing
      // nothing — try exchange, else draw.
      if (best.s < 0) {
        const ex = tryExchange(state, h);
        if (ex) {
          return {
            kind: 'exchange',
            withSeat: ex.withSeat,
            give: ex.give,
            take: ex.take,
            reason: `échange avec seat ${ex.withSeat} (${ex.give.length}↔${ex.take.length} cartes mieux placées)`,
          };
        }
        return { kind: 'draw', reason: `aucune carte utile (best score=${best.s})` };
      }
      const renforts = renfortIndices(state, h);
      const attaches: number[] = [];
      // 1) If the chosen card has the wrong prereq, MAG_O02 (ignore_prereq)
      //    is what enables us to play it — must attach.
      const needsBypass = !meetsPrerequisite(h, best.card, state);
      const ignoreIdx = needsBypass ? ignorePrereqObjectIdx(state, h) : -1;
      if (ignoreIdx !== -1) attaches.push(ignoreIdx);
      // 2) On attacks, attach a damage-boost renfort if we have one.
      if (best.card.degats !== undefined) {
        const boostRenfort = renforts.find(
          (idx) => !attaches.includes(idx) && (h.objects[idx]?.bonus_degats ?? 0) > 0,
        );
        if (boostRenfort !== undefined) attaches.push(boostRenfort);
      }
      // 3) On attacks, also attach an attack_chain renfort (ROD_O02) — its
      //    chain-on-kill flag costs nothing if the attack doesn't kill.
      if (best.card.degats !== undefined) {
        const chainRenfort = renforts.find(
          (idx) =>
            !attaches.includes(idx) && state.effects[h.objects[idx]!.id]?.tag === 'attack_chain',
        );
        if (chainRenfort !== undefined) attaches.push(chainRenfort);
      }
      // Also look for an objet in hand to pose this turn (free alongside
      // play). Only pose objets this hero can actually use — the `prerequis`
      // must match the hero's name, else the objet sits idle.
      // The engine applies placeObject BEFORE playAction — if the posed objet
      // sits before the played action, the action index shifts down by one.
      const poseIdx = h.hand.findIndex(
        (c, i) => i !== best.i && c.categorie === 'objet' && meetsPrerequisite(h, c, state),
      );
      const playIdx = poseIdx !== -1 && poseIdx < best.i ? best.i - 1 : best.i;
      const entry = state.effects[best.card.id];
      const tag = entry?.tag ?? (best.card.degats !== undefined ? 'attack' : 'utility');
      const parts = [
        `${best.card.nom}`,
        `score=${best.s}`,
        tag ? `tag=${tag}` : null,
        best.card.degats !== undefined ? `${best.card.degats} dmg` : null,
        attaches.length > 0 ? 'avec renfort' : null,
        poseIdx !== -1 ? `+ pose ${h.hand[poseIdx]!.nom}` : null,
      ].filter(Boolean);
      return {
        kind: 'play',
        playAction: playIdx,
        renforts: attaches,
        ...(poseIdx !== -1 ? { placeObject: poseIdx } : {}),
        reason: `joue ${parts.join(' · ')}`,
      };
    }

    // No action playable → prefer a useful exchange, else draw.
    const ex = tryExchange(state, h);
    if (ex) {
      return {
        kind: 'exchange',
        withSeat: ex.withSeat,
        give: ex.give,
        take: ex.take,
        reason: `échange avec seat ${ex.withSeat} (${ex.give.length}↔${ex.take.length} cartes mieux placées)`,
      };
    }
    const reasons: string[] = [];
    if (h.hand.length === 0) reasons.push('main vide');
    else if (h.hand.every((c) => !state.effects[c.id] && (!c.degats || c.effet))) {
      reasons.push('aucune carte jouable dans la main');
    } else {
      reasons.push('aucune cible/condition remplie');
    }
    return {
      kind: 'draw',
      reason: `pioche (${reasons.join(', ')})`,
    };
  },

  pickChoice(state, sourceSeat, _sourceCardId, options) {
    // Heuristic: pick option whose label suggests safety/benefit.
    const h = state.heroes[sourceSeat];
    const selfDamage = h ? totalWounds(h) : 0;
    const badKeywords = [
      'encaisser', 'subir', 'tout_donner', 'defausser', 'accepter', 'invocation',
      'capacite_boss', 'attaque_file', 'attaque_toutes',
    ];
    const goodKeywords = [
      'soigner', 'piocher', 'souffler', 'rester_concentre', 'tenir_bon', 'allie_defausse',
      'refuser', 'esquiver', 'se_proteger', 'retenir', 'couvert', 'canaliser',
      'frapper_fort', 'frapper_vite', 'jouer_prudent',
    ];

    // If dangerously low, avoid anything that might damage.
    if (h && selfDamage >= h.vieMax - 1) {
      for (let i = 0; i < options.length; i++) {
        const label = options[i]!.label.toLowerCase();
        if (!badKeywords.some((k) => label.includes(k))) return i;
      }
    }
    const isBad = (label: string) => badKeywords.some((k) => label.includes(k));
    const isGood = (label: string) => goodKeywords.some((k) => label.includes(k));

    // 1st pass: prefer a "good" non-bad option; skip `soigner` if not wounded.
    for (let i = 0; i < options.length; i++) {
      const label = options[i]!.label.toLowerCase();
      if (isBad(label)) continue;
      if (label.includes('soigner') && selfDamage === 0) continue;
      if (isGood(label)) return i;
    }
    // 2nd pass: any non-bad option (even unknown labels are preferable to bad).
    for (let i = 0; i < options.length; i++) {
      const label = options[i]!.label.toLowerCase();
      if (!isBad(label)) return i;
    }
    // 3rd pass: wasted soigner > literally nothing.
    for (let i = 0; i < options.length; i++) {
      const label = options[i]!.label.toLowerCase();
      if (isGood(label)) return i;
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
