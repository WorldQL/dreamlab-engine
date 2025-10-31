import { EPSILON, lerp, smoothLerp } from "@dreamlab/engine";
import * as internal from "@dreamlab/engine/internal";
import { Prng, RandomDistribution, Rng, StandardNormal, StandardUniform } from "../random.ts";
import type { Vector } from "./_vector.ts";

export type IVector2 = {
  x: number;
  y: number;
};

export class Vector2 implements IVector2, Vector<IVector2, Vector2> {
  [internal.vectorOnChanged]: () => void = () => {};

  // #region Constants
  /** All zeroes. */
  public static get ZERO(): Vector2 {
    return new Vector2(0, 0);
  }
  /** All ones. */
  public static get ONE(): Vector2 {
    return new Vector2(1, 1);
  }
  /** All negative ones. */
  public static get NEG_ONE(): Vector2 {
    return new Vector2(-1, -1);
  }
  /** A unit vector pointing along the positive X axis. */
  public static get X(): Vector2 {
    return new Vector2(1, 0);
  }
  /** A unit vector pointing along the positive Y axis. */
  public static get Y(): Vector2 {
    return new Vector2(0, 1);
  }
  /** A unit vector pointing along the negative X axis. */
  public static get NEG_X(): Vector2 {
    return new Vector2(-1, 0);
  }
  /** A unit vector pointing along the negative Y axis. */
  public static get NEG_Y(): Vector2 {
    return new Vector2(0, -1);
  }
  // #endregion

  // #region Fields
  #x: number;
  #y: number;

  public get x(): number {
    return this.#x;
  }

  public set x(value: number) {
    if (value === this.#x) return;

    this.#x = value;
    this[internal.vectorOnChanged]();
  }

  public get y(): number {
    return this.#y;
  }

  public set y(value: number) {
    if (value === this.#y) return;

    this.#y = value;
    this[internal.vectorOnChanged]();
  }

  [internal.vectorForceUpdate](x: number, y: number): void {
    this.#x = x;
    this.#y = y;
  }
  // #endregion

  constructor(x: number, y: number);
  constructor(vector: IVector2);
  constructor(vectorOrX: number | IVector2, y?: number) {
    if (typeof vectorOrX === "object" && "x" in vectorOrX && "y" in vectorOrX) {
      this.#x = vectorOrX.x;
      this.#y = vectorOrX.y;
    } else if (typeof vectorOrX === "number" && typeof y === "number") {
      this.#x = vectorOrX;
      this.#y = y;
    } else {
      throw new TypeError("y was undefined");
    }
  }

  /**
   * Creates a vector with all elements set to {@link value}.
   */
  public static splat(value: number): Vector2 {
    return new Vector2({ x: value, y: value });
  }

  public clone(this: Vector2): Vector2 {
    return new Vector2({ x: this.#x, y: this.#y });
  }

  public bare(this: Vector2): IVector2 {
    return { x: this.#x, y: this.#y };
  }

  public assign(this: Vector2, value: Partial<IVector2>): boolean {
    // Ensure at least one component has changed
    const xChanged = value.x !== undefined && value.x !== this.#x;
    const yChanged = value.y !== undefined && value.y !== this.#y;
    if (!xChanged && !yChanged) return false;

    if (value.x !== undefined && xChanged) {
      this.#x = value.x;
    }

    if (value.y !== undefined && yChanged) {
      this.#y = value.y;
    }

    this[internal.vectorOnChanged]();
    return true;
  }

  // #region Random
  static random(
    min = 0,
    max = 1,
    options?: { prng?: Prng; distribution?: RandomDistribution },
  ): Vector2 {
    const distribution = options?.distribution ?? StandardUniform;
    const x = distribution.randomBetween(min, max, options);
    const y = distribution.randomBetween(min, max, options);

    return new Vector2(x, y);
  }

  static randomUnitCircle(options?: { prng?: Prng }): Vector2 {
    const prng = options?.prng ?? Rng.Fast;
    const [x, y] = StandardNormal[internal.randomBoxMuller](prng, false);

    return Vector2.normalize({ x, y });
  }

  static randomUnitDisc(options?: { prng?: Prng }): Vector2 {
    while (true) {
      const x = StandardUniform.randomBetween(-1, 1, options);
      const y = StandardUniform.randomBetween(-1, 1, options);

      const vec = new Vector2(x, y);
      if (vec.magnitudeSquared() <= 1) return vec;
    }
  }
  // #endregion

  // #region Methods
  // #region Equals
  public static eq(a: IVector2, b: IVector2): boolean {
    return a.x === b.x && a.y === b.y;
  }

  public eq(other: IVector2): boolean {
    return Vector2.eq(this, other);
  }
  // #endregion

  // #region Absolute
  public static abs(vector: IVector2): Vector2 {
    return new Vector2(Math.abs(vector.x), Math.abs(vector.y));
  }

  /**
   * Returns a vector containing the absolute value of each element.
   */
  public abs(this: Vector2): Vector2 {
    return Vector2.abs(this);
  }
  // #endregion

  // #region Negate
  public static neg(vector: IVector2): Vector2 {
    return new Vector2(-vector.x, -vector.y);
  }

  public neg(this: Vector2): Vector2 {
    return Vector2.neg(this);
  }
  // #endregion

  // #region Inverse
  public static inverse(vector: IVector2): Vector2 {
    return new Vector2(1 / vector.x, 1 / vector.y);
  }

  public inverse(this: Vector2): Vector2 {
    return Vector2.inverse(this);
  }
  // #endregion

  // #region Add
  public static add(a: IVector2, b: IVector2): Vector2 {
    return new Vector2(a.x + b.x, a.y + b.y);
  }

  public add(this: Vector2, other: IVector2): Vector2 {
    return Vector2.add(this, other);
  }
  // #endregion

  // #region Subtract
  public static sub(a: IVector2, b: IVector2): Vector2 {
    return new Vector2(a.x - b.x, a.y - b.y);
  }

  public sub(this: Vector2, other: IVector2): Vector2 {
    return Vector2.sub(this, other);
  }
  // #endregion

  // #region Multiply
  public static mul(a: IVector2, b: IVector2 | number): Vector2 {
    if (typeof b === "number") {
      return new Vector2(a.x * b, a.y * b);
    }

    return new Vector2(a.x * b.x, a.y * b.y);
  }

  public mul(this: Vector2, other: IVector2 | number): Vector2 {
    return Vector2.mul(this, other);
  }
  // #endregion

  // #region Divide
  public static div(a: IVector2, b: IVector2 | number): Vector2 {
    if (typeof b === "number") {
      return new Vector2(a.x / b, a.y / b);
    }

    return new Vector2(a.x / b.x, a.y / b.y);
  }

  public div(this: Vector2, other: IVector2 | number): Vector2 {
    return Vector2.div(this, other);
  }
  // #endregion

  // #region Magnitude
  /**
   * Returns the magnitude (length) of a vector.
   */
  public static magnitude(vector: IVector2): number {
    return Math.sqrt(vector.x * vector.x + vector.y * vector.y);
  }

  /**
   * Returns the magnitude (length) of this vector.
   */
  public magnitude(this: Vector2): number {
    return Vector2.magnitude(this);
  }
  // #endregion

  // #region Magnitude Squared
  /**
   * Returns the squared magnitude (length) of a vector.
   */
  public static magnitudeSquared(vector: IVector2): number {
    return vector.x * vector.x + vector.y * vector.y;
  }

  /**
   * Returns the squared magnitude (length) of this vector.
   */
  public magnitudeSquared(this: Vector2): number {
    return Vector2.magnitudeSquared(this);
  }
  // #endregion

  // #region Normalize
  /**
   * Returns a new vector with the magnitude (length) normalized to 1.
   */
  public static normalize(vector: IVector2): Vector2 {
    const magnitude = Vector2.magnitude(vector);
    if (magnitude === 0) return new Vector2(Vector2.ZERO);

    return new Vector2(vector.x / magnitude, vector.y / magnitude);
  }

  /**
   * Returns a new vector with the magnitude (length) normalized to 1.
   */
  public normalize(this: Vector2): Vector2 {
    return Vector2.normalize(this);
  }
  // #endregion

  // #region Look At
  /**
   * Returns the rotation required to look at the target vector.
   */
  public static lookAt(vector: IVector2, target: IVector2): number {
    const { x, y } = Vector2.sub(target, vector);
    return -Math.atan2(x, y);
  }

  /**
   * Returns the rotation required to look at the target vector.
   */
  public lookAt(this: Vector2, target: IVector2): number {
    return Vector2.lookAt(this, target);
  }
  // #endregion

  // #region Lerp
  public static lerp(a: IVector2, b: IVector2, t: number): Vector2 {
    return new Vector2(lerp(a.x, b.x, t), lerp(a.y, b.y, t));
  }

  public static smoothLerp(
    current: IVector2,
    target: IVector2,
    decay: number,
    deltaTime: number,
    epsilon = EPSILON,
  ): Vector2 {
    return new Vector2(
      smoothLerp(current.x, target.x, decay, deltaTime, epsilon),
      smoothLerp(current.y, target.y, decay, deltaTime, epsilon),
    );
  }
  // #endregion

  // #region Distance
  public static distance(a: IVector2, b: IVector2): number {
    const dx = a.x - b.x;
    const dy = a.y - b.y;
    return Math.sqrt(dx * dx + dy * dy);
  }

  /**
   * Get euclidean distance between two vectors
   */
  public distance(this: Vector2, other: IVector2): number {
    return Vector2.distance(this, other);
  }
  // #endregion

  // #region Distance Squared
  public static distanceSquared(a: IVector2, b: IVector2): number {
    const dx = a.x - b.x;
    const dy = a.y - b.y;
    return dx * dx + dy * dy;
  }

  /**
   * Get squared euclidean distance between two vectors
   *
   * Avoids an expensive square root operation
   */
  public distanceSquared(this: Vector2, other: IVector2): number {
    return Vector2.distanceSquared(this, other);
  }
  // #endregion

  // #region Max
  public static max(a: IVector2, b: IVector2): Vector2 {
    return new Vector2(Math.max(a.x, b.x), Math.max(a.y, b.y));
  }

  public max(this: Vector2, other: IVector2): Vector2 {
    return Vector2.max(this, other);
  }
  // #endregion

  // #region Min
  public static min(a: IVector2, b: IVector2): Vector2 {
    return new Vector2(Math.min(a.x, b.x), Math.min(a.y, b.y));
  }

  public min(this: Vector2, other: IVector2): Vector2 {
    return Vector2.min(this, other);
  }
  // #endregion

  // #region Round
  public static round(vector: Vector2): Vector2 {
    return new Vector2(Math.round(vector.x), Math.round(vector.y));
  }

  public round(this: Vector2): Vector2 {
    return Vector2.round(this);
  }
  // #endregion

  // #region Floor
  public static floor(vector: Vector2): Vector2 {
    return new Vector2(Math.floor(vector.x), Math.floor(vector.y));
  }

  public floor(this: Vector2): Vector2 {
    return Vector2.floor(this);
  }
  // #endregion

  // #region Ceil
  public static ceil(vector: Vector2): Vector2 {
    return new Vector2(Math.ceil(vector.x), Math.ceil(vector.y));
  }

  public ceil(this: Vector2): Vector2 {
    return Vector2.ceil(this);
  }
  // #endregion

  // #region Rotate
  public static rotate(vector: IVector2, angle: number): Vector2 {
    const cos = Math.cos(angle);
    const sin = Math.sin(angle);

    return new Vector2(vector.x * cos - vector.y * sin, vector.x * sin + vector.y * cos);
  }

  public rotate(this: Vector2, angle: number): Vector2 {
    return Vector2.rotate(this, angle);
  }
  // #endregion

  // #region Rotate About
  public static rotateAbout(vector: IVector2, angle: number, point: IVector2): Vector2 {
    const cos = Math.cos(angle);
    const sin = Math.sin(angle);

    return new Vector2(
      point.x + ((vector.x - point.x) * cos - (vector.y - point.y) * sin),
      point.y + ((vector.x - point.x) * sin + (vector.y - point.y) * cos),
    );
  }

  public rotateAbout(this: Vector2, angle: number, point: IVector2): Vector2 {
    return Vector2.rotateAbout(this, angle, point);
  }
  // #endregion

  // #region Dot Product
  /**
   * Returns the dot product of two vectors.
   */
  public static dot(a: IVector2, b: IVector2): number {
    return a.x * b.x + a.y * b.y;
  }

  /**
   * Returns the dot product of this vector with another vector.
   */
  public dot(this: Vector2, other: IVector2): number {
    return Vector2.dot(this, other);
  }
  // #endregion

  // #region Cross Product
  /**
   * Returns the cross product of two vectors.
   */
  public static cross(a: IVector2, b: IVector2): number {
    return a.x * b.y - a.y * b.x;
  }

  /**
   * Returns the cross product of this vector with another vector.
   */
  public cross(this: Vector2, other: IVector2): number {
    return Vector2.cross(this, other);
  }
  // #endregion

  // #region Reflect
  public static reflect(vector: IVector2, normal: IVector2): Vector2 {
    const factor = -2 * Vector2.dot(normal, vector);
    return new Vector2(factor * normal.x + vector.x, factor * normal.y + vector.y);
  }

  public reflect(this: Vector2, normal: IVector2): Vector2 {
    return Vector2.reflect(this, normal);
  }
  // #endregion
  // #endregion

  /**
   * @ignore
   */
  public toString(): string {
    return `Vec2 { x: ${this.#x}, y: ${this.#y} }`;
  }

  /**
   * @ignore
   */
  public toJSON(): IVector2 {
    return this.bare();
  }

  /**
   * @ignore
   */
  public [Symbol.for("Deno.customInspect")](
    inspect: typeof Deno.inspect,
    options: Deno.InspectOptions,
  ): string {
    return `${this.constructor.name} ${inspect(this.bare(), options)}`;
  }
}
