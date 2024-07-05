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

  /**
   * @ignore
   */
  toString(): string;
  /**
   * @ignore
   */
  toJSON(): I;
}
