import * as internal from "@dreamlab/engine/internal";
import type { Prng, RandomOptions, SampleOptions } from "jsr:@std/random@0.1.0";
import {
  randomBetween,
  randomIntegerBetween,
  randomSeeded,
  sample,
  shuffle,
} from "jsr:@std/random@0.1.0";

export type { Prng, RandomOptions } from "jsr:@std/random@0.1.0";

// #region Rng
/**
 * Collection of random number generators with distribution [0, 1)
 */
export const Rng = Object.freeze(
  new (class {
    // #region Fast
    /**
     * Fast but insecure RNG
     *
     * Alias of {@link Math.random}
     */
    Fast: Prng = () => Math.random();
    // #endregion

    // #region Seeded
    /**
     * Seeded RNG using the {@link https://www.pcg-random.org/download.html | PCG32} algorithm
     * @param seed
     * @returns
     */
    Seeded: (seed: bigint) => Prng = seed => randomSeeded(seed);
    // #endregion

    // #region Secure
    #randomValues = new Uint32Array(32);
    #randomInts: number[] = [];

    /** Secure RNG backed by {@link crypto.getRandomValues} */
    Secure: Prng = () => {
      if (this.#randomInts.length === 0) {
        crypto.getRandomValues(this.#randomValues);
        this.#randomInts.push(...this.#randomValues);
      }

      const [int] = this.#randomInts.splice(0, 1);
      return int / 2 ** 32;
    };
    // #endregion
  })(),
);

const DEFAULT_RNG = Rng.Fast;
// #endregion

// #region Random Distribution
export abstract class RandomDistribution {
  protected abstract nextValue(prng: Prng): number;

  /**
   * Generates a random number in the range [0, 1)
   */
  random(options: RandomOptions = {}): number {
    const prng = options.prng ?? DEFAULT_RNG;
    return this.nextValue(prng);
  }

  /**
   * Generates a random number between `min` and `max`
   */
  randomBetween(min: number, max: number, options: RandomOptions = {}): number {
    const prng = options.prng ?? DEFAULT_RNG;
    return randomBetween(min, max, { prng: () => this.nextValue(prng) });
  }

  /**
   * Generates a random integer between `min` and `max`
   */
  randomIntegerBetween(min: number, max: number, options: RandomOptions = {}): number {
    const prng = options.prng ?? DEFAULT_RNG;
    return randomIntegerBetween(min, max, { prng: () => this.nextValue(prng) });
  }

  /**
   * Returns a random element from the given array
   */
  sample<T>(array: ArrayLike<T>, options: SampleOptions = {}): T {
    const prng = options.prng ?? DEFAULT_RNG;
    const sampled = sample(array, { ...options, prng: () => this.nextValue(prng) });

    if (sampled === undefined) throw new Error("tried to sample an empty array");
    return sampled;
  }

  /**
   * Shuffles the provided array, returning a copy and without modifying the original array
   */
  shuffle<T>(items: readonly T[], options: RandomOptions = {}): T[] {
    const prng = options.prng ?? DEFAULT_RNG;
    return shuffle(items, { prng: () => this.nextValue(prng) });
  }
}

// #region Uniform
class _StandardUniform extends RandomDistribution {
  protected nextValue(prng: Prng): number {
    return prng();
  }
}

/**
 * Uniform distribution
 */
export const StandardUniform = Object.freeze(new _StandardUniform());
// #endregion

// #region Normal
/**
 * Normal (gaussian) distribution
 */
class Normal extends RandomDistribution {
  public constructor(
    public readonly min = 0,
    public readonly max = 1,
    public readonly skew = 1,
  ) {
    super();
  }

  [internal.randomBoxMuller](prng: Prng, transform = true): [number, number] {
    let u = 0;
    let v = 0;

    while (u === 0) u = prng(); // converting [0,1) to (0,1)
    while (v === 0) v = prng();

    const pi = 2 * Math.PI * v;
    const R = Math.sqrt(-2 * Math.log(u));
    let a = R * Math.cos(pi);
    let b = R * Math.sin(pi);

    if (!transform) return [a, b];

    a = a / 10 + 0.5; // rescale to 0 -> 1
    b = b / 10 + 0.5;

    if (a > 1 || a < 0 || b > 1 || b < 0) {
      return this[internal.randomBoxMuller](prng, true);
    } else {
      const { min, max, skew } = this;

      a = Math.pow(a, skew);
      a *= max - min;
      a += min;

      b = Math.pow(b, skew);
      b *= max - min;
      b += min;

      return [a, b];
    }
  }

  #values = new Map<Prng, number[]>();
  protected nextValue(prng: Prng): number {
    const values = this.#values.get(prng) ?? [];
    if (values.length === 0) {
      values.push(...this[internal.randomBoxMuller](prng));
      this.#values.set(prng, values);
    }

    const [value] = this.#values.get(prng)!.splice(0, 1);
    return value;
  }
}

/**
 * Standard Normal (Gaussian) Distribution
 */
export const StandardNormal = Object.freeze(new Normal());
// #endregion
// #endregion
