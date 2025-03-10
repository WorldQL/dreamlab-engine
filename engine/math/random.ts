import { Vector2 } from "./mod.ts";

export class Random {
  // #region utils
  static #boxmuller(): readonly [number, number] {
    let u = 0;
    let v = 0;

    while (u === 0) u = Math.random();
    while (v === 0) v = Math.random();

    const pi = 2 * Math.PI * v;
    const R = Math.sqrt(-2 * Math.log(u));
    const x = R * Math.cos(pi);
    const y = R * Math.sin(pi);

    return [x, y] as const;
  }
  // #endregion

  /**
   * Random value in the range [0,1) with uniform distribution
   *
   * Alias of {@link Math.random}
   */
  static uniform(): number {
    return Math.random();
  }

  /**
   * Random value in the range (0,1) with normal (gaussian) distribution
   */
  static normal(): number {
    const [a, b] = this.#boxmuller();
    const numA = a / 10.0 + 0.5; // translate to 0 -> 1
    if (numA <= 1 && numA >= 0) return numA;

    const numB = b / 10.0 + 0.5;
    if (numB <= 1 && numB >= 0) return numB;

    return this.normal(); // resample between 0 and 1
  }

  /**
   * {@link Vector2} with x/y components sampled using [0,1) uniform distribution
   */
  static vector2(): Vector2 {
    return new Vector2(this.uniform(), this.uniform());
  }

  /**
   * {@link Vector2} randomly sampled from a unit circle
   */
  static unitVector2(): Vector2 {
    const [x, y] = this.#boxmuller();
    return Vector2.normalize({ x, y });
  }
}
