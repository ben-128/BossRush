import { describe, it, expect } from 'vitest';
import { Rng } from '../engine/rng.js';

describe('Rng', () => {
  it('produces the same sequence for the same seed', () => {
    const a = new Rng(42);
    const b = new Rng(42);
    for (let i = 0; i < 100; i++) {
      expect(a.nextFloat()).toBe(b.nextFloat());
    }
  });

  it('produces different sequences for different seeds', () => {
    const a = new Rng(1);
    const b = new Rng(2);
    const seqA = Array.from({ length: 10 }, () => a.nextFloat());
    const seqB = Array.from({ length: 10 }, () => b.nextFloat());
    expect(seqA).not.toEqual(seqB);
  });

  it('accepts string seeds', () => {
    const a = new Rng('hello');
    const b = new Rng('hello');
    expect(a.nextFloat()).toBe(b.nextFloat());
    const c = new Rng('world');
    // Very unlikely collision after hashing.
    expect(new Rng('hello').nextFloat()).not.toBe(c.nextFloat());
  });

  it('floats stay in [0, 1)', () => {
    const rng = new Rng(7);
    for (let i = 0; i < 1000; i++) {
      const x = rng.nextFloat();
      expect(x).toBeGreaterThanOrEqual(0);
      expect(x).toBeLessThan(1);
    }
  });

  it('nextInt respects bounds inclusively', () => {
    const rng = new Rng(123);
    const min = -3;
    const max = 7;
    let sawMin = false;
    let sawMax = false;
    for (let i = 0; i < 5000; i++) {
      const x = rng.nextInt(min, max);
      expect(Number.isInteger(x)).toBe(true);
      expect(x).toBeGreaterThanOrEqual(min);
      expect(x).toBeLessThanOrEqual(max);
      if (x === min) sawMin = true;
      if (x === max) sawMax = true;
    }
    expect(sawMin).toBe(true);
    expect(sawMax).toBe(true);
  });

  it('pick throws on empty array', () => {
    const rng = new Rng(1);
    expect(() => rng.pick([])).toThrow();
  });

  it('shuffle does not mutate input and preserves elements', () => {
    const rng = new Rng(999);
    const input = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];
    const frozen = input.slice();
    const shuffled = rng.shuffle(input);
    expect(input).toEqual(frozen); // input untouched
    expect(shuffled.slice().sort((a, b) => a - b)).toEqual(frozen.slice().sort((a, b) => a - b));
  });

  it('shuffle is deterministic per seed', () => {
    const arr = Array.from({ length: 20 }, (_, i) => i);
    const s1 = new Rng(0xdeadbeef).shuffle(arr);
    const s2 = new Rng(0xdeadbeef).shuffle(arr);
    expect(s1).toEqual(s2);
  });

  it('serializes and restores state', () => {
    const rng = new Rng(42);
    for (let i = 0; i < 50; i++) rng.nextFloat();
    const snapshot = rng.state;
    const next = rng.nextFloat();
    const restored = Rng.fromState(snapshot);
    expect(restored.nextFloat()).toBe(next);
  });

  it('rejects invalid numeric seeds', () => {
    expect(() => new Rng(-1)).toThrow(RangeError);
    expect(() => new Rng(1.5)).toThrow(RangeError);
    expect(() => new Rng(2 ** 32)).toThrow(RangeError);
  });
});
