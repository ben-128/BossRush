import type { GameEvent } from '../engine/events.js';
import type { DesignData, CarteChasse } from '../engine/types.js';
import type { HeroRuntime, MonsterInstance, Wound } from '../engine/gameState.js';

/**
 * Returns a "displayed" copy of the hero with hand/objects/queue rolled back
 * so that events at index >= `visibleCount` appear not to have happened yet.
 * Used by HeroPanel so that cards/monsters appear-and-disappear in sync with
 * PlaybackTicker's reveal cadence, instead of jumping straight to the final
 * state mutated by runTurn.
 */
export function displayedHero(
  h: HeroRuntime,
  events: ReadonlyArray<GameEvent>,
  visibleCount: number,
  seat: number,
  design: DesignData,
): HeroRuntime {
  // Shallow-clone the mutable collections.
  let hand: CarteChasse[] = [...h.hand];
  let objects: CarteChasse[] = [...h.objects];
  let queue: MonsterInstance[] = [...h.queue];
  let wounds: Wound[] = [...h.wounds];

  const chasseById = new Map(design.cartesChasse.map((c) => [c.id, c]));

  // Walk unrevealed events in reverse, undoing each.
  for (let i = events.length - 1; i >= visibleCount; i--) {
    const ev = events[i]!;
    switch (ev.kind) {
      case 'INITIAL_HAND':
        if (ev.seat === seat) hand = [];
        break;
      case 'DRAW_CARD':
        if (ev.pile === 'chasse' && ev.toSeat === seat) {
          const idx = findLastIdx(hand, (c) => c.id === ev.card);
          if (idx >= 0) hand.splice(idx, 1);
        }
        break;
      case 'DISCARD_CARD':
        if (ev.pile === 'chasse' && ev.fromSeat === seat) {
          const card = chasseById.get(ev.card);
          if (card) hand.push(card);
        }
        break;
      case 'ACTION_DRAW':
        if (ev.seat === seat) {
          for (const id of ev.drew) {
            const idx = findLastIdx(hand, (c) => c.id === id);
            if (idx >= 0) hand.splice(idx, 1);
          }
        }
        break;
      case 'ACTION_PLAY_ACTION':
        if (ev.seat === seat) {
          const card = chasseById.get(ev.card);
          if (card) hand.push(card);
          // Renforts were consumed from objects; restore them.
          for (const rid of ev.renforts) {
            const r = chasseById.get(rid);
            if (r) objects.push(r);
          }
        }
        break;
      case 'ACTION_PLAY_OBJECT':
        if (ev.seat === seat) {
          const oi = findLastIdx(objects, (c) => c.id === ev.card);
          if (oi >= 0) objects.splice(oi, 1);
          const card = chasseById.get(ev.card);
          if (card) hand.push(card);
        }
        break;
      case 'OBJECT_USED':
        if (ev.seat === seat) {
          const card = chasseById.get(ev.card);
          if (card) objects.push(card);
        }
        break;
      case 'ACTION_EXCHANGE': {
        // Active seat gave `given`, received `received`.
        if (ev.seat === seat) {
          for (const r of ev.received) {
            const idx = findLastIdx(hand, (c) => c.id === r);
            if (idx >= 0) hand.splice(idx, 1);
          }
          for (const g of ev.given) {
            const card = chasseById.get(g);
            if (card) hand.push(card);
          }
        }
        // Partner seat gave `received`, received `given`.
        if (ev.withSeat === seat) {
          for (const g of ev.given) {
            const idx = findLastIdx(hand, (c) => c.id === g);
            if (idx >= 0) hand.splice(idx, 1);
          }
          for (const r of ev.received) {
            const card = chasseById.get(r);
            if (card) hand.push(card);
          }
        }
        break;
      }
      case 'SUMMON_MONSTER':
        if (ev.seat === seat) {
          queue = queue.filter((m) => m.instanceId !== ev.instanceId);
        }
        break;
      case 'MONSTER_MOVED':
        if (ev.toSeat === seat && ev.fromSeat !== seat) {
          queue = queue.filter((m) => m.instanceId !== ev.instanceId);
        } else if (ev.fromSeat === seat && ev.toSeat !== seat) {
          queue.push({ instanceId: ev.instanceId, cardId: ev.cardId, wounds: [] });
        }
        // Same-seat repositioning is ignored (cosmetic).
        break;
      case 'ELIMINATE_MONSTER':
        if (ev.seat === seat) {
          queue.push({ instanceId: ev.instanceId, cardId: ev.cardId, wounds: [] });
        }
        break;
      case 'DAMAGE':
        if (ev.targetKind === 'hero') {
          // Match by heroId on the *current* heroes array: the target is
          // identified by heroId, and we're rolling back this seat's wounds
          // only when the wound belongs here.
          const idx = wounds.findIndex((w) => w.woundId === ev.woundId);
          if (idx >= 0) wounds.splice(idx, 1);
        }
        break;
      case 'HEAL_APPLIED':
        if (ev.seat === seat) {
          // Re-insert removed wounds to restore state prior to this heal.
          for (const r of ev.removed) {
            wounds.push({
              woundId: r.woundId,
              degats: r.degats,
              // eslint-disable-next-line @typescript-eslint/no-explicit-any
              source: r.source as any,
              sourceCardId: r.sourceCardId,
            });
          }
        }
        break;
    }
  }

  return { ...h, hand, objects, queue, wounds };
}

function findLastIdx<T>(arr: T[], pred: (x: T) => boolean): number {
  for (let i = arr.length - 1; i >= 0; i--) {
    if (pred(arr[i]!)) return i;
  }
  return -1;
}
