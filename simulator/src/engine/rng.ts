/**
 * Seeded pseudo-random number generator.
 *
 * All randomness in the engine MUST go through a Rng instance. This is what
 * guarantees replay determinism: same seed + same actions = same outcome.
 *
 * Implementation: mulberry32. 32-bit state, fast, good enough quality for a
 * card game simulator (no cryptographic properties needed). Zero dependencies.
 *
 * The state is a single uint32 — easy to serialize alongside the GameState
 * so saved games / log replays work without tracking PRNG internals.
 */

const UINT32_MAX = 0x1_0000_0000;

/** Hash a string seed into a uint32 for mulberry32 bootstrapping. */
function hashSeed(input: string): number {
  let h = 2166136261 >>> 0;
  for (let i = 0; i < input.length; i++) {
    h ^= input.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

export class Rng {
  /** Current internal state. Exposed (read-only) for serialization. */
  public state: number;

  constructor(seed: number | string) {
    if (typeof seed === 'string') {
      this.state = hashSeed(seed);
    } else if (Number.isInteger(seed) && seed >= 0 && seed < UINT32_MAX) {
      this.state = seed >>> 0;
    } else {
      throw new RangeError(
        `Rng seed must be a non-negative integer < 2^32 or a string, got: ${String(seed)}`,
      );
    }
    // Avoid the degenerate state 0 → always returns 0.
    if (this.state === 0) this.state = 0x9e37_79b9;
  }

  /** Restore an Rng from a serialized state (for replays). */
  static fromState(state: number): Rng {
    const rng = new Rng(1);
    rng.state = state >>> 0;
    return rng;
  }

  /** Advance and return the next uint32. */
  private nextUint32(): number {
    this.state = (this.state + 0x6d2b_79f5) >>> 0;
    let t = this.state;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return (t ^ (t >>> 14)) >>> 0;
  }

  /** Uniform float in [0, 1). */
  nextFloat(): number {
    return this.nextUint32() / UINT32_MAX;
  }

  /** Integer in [min, max] inclusive. */
  nextInt(min: number, max: number): number {
    if (!Number.isInteger(min) || !Number.isInteger(max)) {
      throw new TypeError('Rng.nextInt requires integer bounds');
    }
    if (max < min) {
      throw new RangeError(`Rng.nextInt: max (${max}) < min (${min})`);
    }
    const range = max - min + 1;
    return min + Math.floor(this.nextFloat() * range);
  }

  /** Uniform pick from a non-empty array. Throws on empty. */
  pick<T>(items: readonly T[]): T {
    if (items.length === 0) throw new RangeError('Rng.pick: empty array');
    const idx = this.nextInt(0, items.length - 1);
    return items[idx] as T;
  }

  /**
   * Fisher-Yates shuffle. Returns a NEW array (caller's input untouched).
   * This is the canonical way to build piles (Chasse, Menace, Monstres, Destins).
   */
  shuffle<T>(items: readonly T[]): T[] {
    const out = items.slice();
    for (let i = out.length - 1; i > 0; i--) {
      const j = this.nextInt(0, i);
      const tmp = out[i] as T;
      out[i] = out[j] as T;
      out[j] = tmp;
    }
    return out;
  }
}
