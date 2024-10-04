export interface Vector<I, T extends I> {
  clone(this: T): T;
  bare(this: T): I;
  assign(this: T, value: Partial<I>): boolean;

  eq(this: T, other: I): boolean;

  /**
   * Returns a vector containing the absolute value of each element.
   */
  abs(this: T): T;
  neg(this: T): T;
  inverse(this: T): T;

  add(this: T, other: I): T;
  sub(this: T, other: I): T;
  mul(this: T, other: I | number): T;
  div(this: T, other: I | number): T;

  /**
   * Returns the magnitude (length) of this vector.
   */
  magnitude(this: T): number;

  /**
   * Returns the squared magnitude (length) of this vector.
   */
  magnitudeSquared(this: T): number;

  /**
   * Returns a new vector with the magnitude (length) normalized to 1.
   */
  normalize(this: T): T;

  /**
   * Returns the rotation required to look at the target vector.
   */
  lookAt(this: T, target: I): number;

  distance(this: T, target: I): number;
  distanceSquared(this: T, target: I): number;

  max(this: T, other: I): T;
  min(this: T, other: I): T;

  rotate(this: T, angle: number): T;
  rotateAbout(this: T, angle: number, point: I): T;

  /**
   * @ignore
   */
  toString(): string;
  /**
   * @ignore
   */
  toJSON(): I;
}
