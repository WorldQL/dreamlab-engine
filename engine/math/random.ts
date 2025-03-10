import { Vector2 } from "./mod.ts";

export class Random {
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
  static gaussian(): number {
    let u = 0;
    let v = 0;

    while (u === 0) u = Math.random();
    while (v === 0) v = Math.random();

    let num = Math.sqrt(-2.0 * Math.log(u)) * Math.cos(2.0 * Math.PI * v);
    num = num / 10.0 + 0.5; // Translate to 0 -> 1

    if (num > 1 || num < 0) return Random.gaussian(); // resample between 0 and 1
    return num;
  }

  /**
   * {@link Vector2} with x/y components sampled using [0,1) uniform distribution
   */
  static vector2(): Vector2 {
    return new Vector2(Random.uniform(), Random.uniform());
  }

  /**
   * {@link Vector2} randomly sampled from a unit circle
   */
  static unitVector2(): Vector2 {
    const x = Random.gaussian();
    const y = Random.gaussian();
    return Vector2.normalize({ x, y });
  }
}
