export interface Vector<I, T extends I> {
  clone(this: T): T;
  bare(this: T): I;
  assign(this: T, value: Partial<I>): boolean;

  /**
   * Returns a vector containing the absolute value of each element.
   */
  abs(this: T): T;
  neg(this: T): T;

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
   * @ignore
   */
  toString(): string;
  /**
   * @ignore
   */
  toJSON(): I;
}

export type VectorEvents<I, T extends I> =
  & { readonly changed: [value: T, previous: Readonly<I>] }
  & { readonly [K in keyof I]: [value: number, previous: number] };
