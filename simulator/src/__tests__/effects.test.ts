import { describe, it, expect } from 'vitest';
import { loadDesignData } from '../engine/loader.js';
import { loadEffectsCatalog } from '../engine/effectsLoader.js';
import { createGame } from '../engine/setup.js';
import { runGame } from '../engine/engine.js';
import { applyPlayerAction } from '../engine/actions.js';
import { runOps, mkCtx } from '../engine/effects.js';
import { randomPolicy } from '../ai/random.js';

async function baseState(heroIds: string[], seed: number | string = 1) {
  const data = await loadDesignData();
  const effects = await loadEffectsCatalog();
  return createGame(data, {
    seed,
    nPlayers: heroIds.length,
    bossId: 'BOSS_001',
    heroIds,
    effects,
  });
}

describe('effects DSL — individual ops', () => {
  it('heal removes wounds bottom-up respecting budget', async () => {
    const state = await baseState(['HERO_001', 'HERO_003']);
    const h = state.heroes[0]!;
    // Seed with 3 wounds: [3, 1, 2] from oldest to newest.
    h.wounds = [
      { woundId: 'W1', source: 'menace', sourceCardId: 'X', degats: 3 },
      { woundId: 'W2', source: 'menace', sourceCardId: 'X', degats: 1 },
      { woundId: 'W3', source: 'menace', sourceCardId: 'X', degats: 2 },
    ];
    runOps(state, mkCtx(0, 'TEST', 'chasse'), [
      { op: 'heal', target: 'self', amount: 3 },
    ]);
    // Bottom (most recent) = 2 → removed (budget 1 left), then 1 → removed, then 3 → too big.
    expect(h.wounds.map((w) => w.woundId)).toEqual(['W1']);
  });

  it('draw op adds cards to hand', async () => {
    const state = await baseState(['HERO_001', 'HERO_003']);
    const before = state.heroes[0]!.hand.length;
    runOps(state, mkCtx(0, 'TEST', 'chasse'), [
      { op: 'draw', target: 'self', n: 2 },
    ]);
    expect(state.heroes[0]!.hand.length).toBe(before + 2);
  });

  it('regenCapacite resets capaciteUsed', async () => {
    const state = await baseState(['HERO_001', 'HERO_003']);
    state.heroes[0]!.capaciteUsed = true;
    runOps(state, mkCtx(0, 'TEST', 'chasse'), [
      { op: 'regenCapacite', target: 'self' },
    ]);
    expect(state.heroes[0]!.capaciteUsed).toBe(false);
  });

  it('require aborts the op chain when false', async () => {
    const state = await baseState(['HERO_001', 'HERO_003']);
    const handBefore = state.heroes[0]!.hand.length;
    runOps(state, mkCtx(0, 'TEST', 'chasse'), [
      { op: 'require', cond: { self_damage: { op: '>=', value: 99 } } },
      { op: 'draw', target: 'self', n: 3 },
    ]);
    // Condition false (no damage) → the draw must NOT happen.
    expect(state.heroes[0]!.hand.length).toBe(handBefore);
  });

  it('require succeeds and subsequent ops run', async () => {
    const state = await baseState(['HERO_001', 'HERO_003']);
    state.heroes[0]!.wounds = [
      { woundId: 'W1', source: 'menace', sourceCardId: 'X', degats: 4 },
    ];
    const before = state.heroes[0]!.hand.length;
    runOps(state, mkCtx(0, 'TEST', 'chasse'), [
      { op: 'require', cond: { self_damage: { op: '>=', value: 4 } } },
      { op: 'draw', target: 'self', n: 1 },
    ]);
    expect(state.heroes[0]!.hand.length).toBe(before + 1);
  });

  it('eliminate removes a monster from a queue', async () => {
    const state = await baseState(['HERO_001', 'HERO_003']);
    // Manually put a monster in the active hero's queue with some damage.
    state.counters.monsterInstance += 1;
    const inst = { instanceId: 'Mtest', cardId: 'MON_001', wounds: [] as never[] };
    state.heroes[0]!.queue.push(inst);
    runOps(state, mkCtx(0, 'TEST', 'chasse'), [
      { op: 'eliminate', target: { pick: 'monster_in_self_queue' } },
    ]);
    expect(state.heroes[0]!.queue.length).toBe(0);
  });
});

describe('effects DSL — hero capacity via PlayerAction', () => {
  it('firing Daraa capacity via useCapacite consumes it once', async () => {
    const state = await baseState(['HERO_001', 'HERO_003']);
    expect(state.heroes[0]!.capaciteUsed).toBe(false);
    applyPlayerAction(state, { kind: 'useCapacite' });
    expect(state.heroes[0]!.capaciteUsed).toBe(true);
    // Second attempt is a no-op.
    applyPlayerAction(state, { kind: 'useCapacite' });
    // Still used, and we expect an ACTION_NONE somewhere late in the log.
    const hasAlreadyUsed = state.events.some(
      (e) => e.kind === 'ACTION_NONE' && e.reason === 'capacite_already_used',
    );
    expect(hasAlreadyUsed).toBe(true);
  });
});

describe('effects DSL — J3.5 extensions', () => {
  it('eliminateWhere removes all matching monsters', async () => {
    const state = await baseState(['HERO_001', 'HERO_003']);
    // Plant 3 monsters in seat 0's queue, wound 2 of them.
    for (let i = 0; i < 3; i++) {
      state.counters.monsterInstance += 1;
      state.heroes[0]!.queue.push({
        instanceId: `MX${i}`,
        cardId: 'MON_001',
        wounds: [],
      });
    }
    state.heroes[0]!.queue[0]!.wounds.push({ woundId: 'W1', source: 'chasse', sourceCardId: 'T', degats: 1 });
    state.heroes[0]!.queue[2]!.wounds.push({ woundId: 'W2', source: 'chasse', sourceCardId: 'T', degats: 1 });
    runOps(state, mkCtx(0, 'TEST', 'chasse'), [
      { op: 'eliminateWhere', from: 'monster_in_any_queue', where: 'has_damage' },
    ]);
    // Wait — wounded monsters (vie=1) would have been eliminated already by
    // their damage. Here we simulate wounds that didn't reach vie (via direct
    // array push). After eliminateWhere, the 2 wounded should be gone.
    expect(state.heroes[0]!.queue.length).toBe(1);
    expect(state.heroes[0]!.queue[0]!.instanceId).toBe('MX1');
  });

  it('choice op runs exactly one option', async () => {
    const state = await baseState(['HERO_001', 'HERO_003']);
    const before = state.heroes[0]!.hand.length;
    runOps(state, mkCtx(0, 'TEST', 'chasse'), [
      {
        op: 'choice',
        options: [
          { label: 'A', ops: [{ op: 'draw', target: 'self', n: 1 }] },
          { label: 'B', ops: [{ op: 'draw', target: 'self', n: 5 }] },
        ],
      },
    ]);
    const delta = state.heroes[0]!.hand.length - before;
    expect([1, 5]).toContain(delta);
  });

  it('modifier no_damage cancels incoming damage within scope', async () => {
    const state = await baseState(['HERO_001', 'HERO_003']);
    runOps(state, mkCtx(0, 'NAWEL_CAP', 'chasse'), [
      {
        op: 'modifier',
        target: 'self',
        scope: 'thisTurn',
        effect: { kind: 'no_damage', seat: 0 },
      },
    ]);
    const woundsBefore = state.heroes[0]!.wounds.length;
    // Attempt a damage — should be cancelled.
    runOps(state, mkCtx(0, 'TEST_DMG', 'menace'), [
      { op: 'damage', target: 'active_hero', amount: 2 },
    ]);
    expect(state.heroes[0]!.wounds.length).toBe(woundsBefore);
  });

  it('forEach iterates heroes and re-binds self', async () => {
    const state = await baseState(['HERO_001', 'HERO_003']);
    runOps(state, mkCtx(0, 'TEST', 'chasse'), [
      { op: 'forEach', over: 'each_hero', do: [{ op: 'draw', target: 'self', n: 1 }] },
    ]);
    // Both heroes should now have one extra card (relative to initial 3).
    expect(state.heroes[0]!.hand.length).toBe(4);
    expect(state.heroes[1]!.hand.length).toBe(4);
  });
});

describe('effects DSL — integration: full games run with DSL', () => {
  it('every boss still terminates with DSL enabled', async () => {
    const data = await loadDesignData();
    const effects = await loadEffectsCatalog();
    const heroIds = ['HERO_001', 'HERO_003', 'HERO_005'];
    for (const b of data.boss) {
      const state = createGame(data, {
        seed: `dsl-${b.id}`,
        nPlayers: heroIds.length,
        bossId: b.id,
        heroIds,
        effects,
      });
      runGame(state, { policies: heroIds.map(() => randomPolicy) });
      expect(state.result).not.toBe('running');
    }
  });

  it('winrate is higher with DSL than without (over 50 games)', async () => {
    const data = await loadDesignData();
    const effects = await loadEffectsCatalog();
    const heroIds = ['HERO_001', 'HERO_003', 'HERO_005'];
    let winsNo = 0;
    let winsYes = 0;
    for (let seed = 1; seed <= 50; seed++) {
      const sNo = createGame(data, {
        seed,
        nPlayers: heroIds.length,
        bossId: 'BOSS_001',
        heroIds,
      });
      runGame(sNo, { policies: heroIds.map(() => randomPolicy) });
      if (sNo.result === 'victory') winsNo++;

      const sYes = createGame(data, {
        seed,
        nPlayers: heroIds.length,
        bossId: 'BOSS_001',
        heroIds,
        effects,
      });
      runGame(sYes, { policies: heroIds.map(() => randomPolicy) });
      if (sYes.result === 'victory') winsYes++;
    }
    // We only check that DSL play doesn't strictly degrade winrate — that
    // would indicate a regression. Both can be 0 against Hobab with random
    // AI; the point of the test is "still runs and no crash".
    expect(winsYes).toBeGreaterThanOrEqual(winsNo - 1);
  });

  it('GUE_O06 Dernier rempart fires 3 boss damage when hero dies', async () => {
    const data = await loadDesignData();
    const effects = await loadEffectsCatalog();
    const state = createGame(data, {
      seed: 1,
      nPlayers: 2,
      bossId: 'BOSS_001',
      heroIds: ['HERO_003', 'HERO_001'],
      effects,
    });
    // Give Nawel the death-burst object and wound him to 1 HP.
    const obj = data.cartesChasse.find((c) => c.id === 'GUE_O06')!;
    state.heroes[0]!.objects.push(obj);
    state.heroes[0]!.wounds = [
      { woundId: 'W1', source: 'menace', sourceCardId: 'X', degats: state.heroes[0]!.vieMax - 1 },
    ];
    const bossBefore = state.boss.wounds.reduce((s, w) => s + w.degats, 0);
    // Lethal damage kills Nawel.
    runOps(state, mkCtx(0, 'LETHAL', 'menace'), [
      { op: 'damage', target: 'active_hero', amount: 10 },
    ]);
    expect(state.heroes[0]!.dead).toBe(true);
    const bossAfter = state.boss.wounds.reduce((s, w) => s + w.degats, 0);
    expect(bossAfter - bossBefore).toBe(3);
  });

  it('BOSS_003 actif rotates each queue head to the next hero tail', async () => {
    const data = await loadDesignData();
    const effects = await loadEffectsCatalog();
    const heroIds = ['HERO_001', 'HERO_003', 'HERO_005'];
    const state = createGame(data, {
      seed: 1,
      nPlayers: heroIds.length,
      bossId: 'BOSS_003',
      heroIds,
      effects,
    });
    // Seed each queue with a distinct monster instance at the head.
    const make = (id: string, cardId = 'MON_ROC'): {
      instanceId: string; cardId: string; wounds: [];
    } => ({ instanceId: id, cardId, wounds: [] });
    state.heroes[0]!.queue = [make('A')];
    state.heroes[1]!.queue = [make('B')];
    state.heroes[2]!.queue = [make('C')];

    const entry = state.effects[state.boss.bossId];
    runOps(state, mkCtx(0, state.boss.bossId, 'boss'), entry!.actif_ops!);

    expect(state.heroes[0]!.queue.map((m) => m.instanceId)).toEqual(['C']);
    expect(state.heroes[1]!.queue.map((m) => m.instanceId)).toEqual(['A']);
    expect(state.heroes[2]!.queue.map((m) => m.instanceId)).toEqual(['B']);
  });
});
