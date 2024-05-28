import { z } from "../_deps/zod.ts";
import { ReadonlyEmitter } from "../events/mod.ts";
import { EPSILON, lerp } from "./lerp.ts";
import { Vector, VectorEvents } from "./vector.ts";

export type ReadonlyIVec2 = Readonly<IVec2>;
export interface IVec2 {
  x: number;
  y: number;
}

export type Vec2Events = VectorEvents<IVec2, Vec2>;
export class Vec2 extends ReadonlyEmitter<Vec2Events>
  implements IVec2, Vector<IVec2, Vec2> {
  // #region Constants
  /** All zeroes. */
  public static readonly ZERO: Readonly<IVec2> = Object.freeze({
    x: 0,
    y: 0,
  });
  /** All ones. */
  public static readonly ONE: Readonly<IVec2> = Object.freeze({
    x: 1,
    y: 1,
  });
  /** All negative ones. */
  public static readonly NEG_ONE: Readonly<IVec2> = Object.freeze({
    x: -1,
    y: -1,
  });
  /** A unit vector pointing along the positive X axis. */
  public static readonly X: Readonly<IVec2> = Object.freeze({
    ...Vec2.ZERO,
    x: 1,
  });
  /** A unit vector pointing along the positive Y axis. */
  public static readonly Y: Readonly<IVec2> = Object.freeze({
    ...Vec2.ZERO,
    y: 1,
  });
  /** A unit vector pointing along the negative X axis. */
  public static readonly NEG_X: Readonly<IVec2> = Object.freeze({
    ...Vec2.ZERO,
    x: -1,
  });
  /** A unit vector pointing along the negative Y axis. */
  public static readonly NEG_Y: Readonly<IVec2> = Object.freeze({
    ...Vec2.ZERO,
    y: -1,
  });
  // #endregion

  public static schema = z.object({ x: z.number(), y: z.number() }).or(
    z.tuple([z.number(), z.number()]),
  ).transform((coords) => {
    const [x, y] = Array.isArray(coords) ? coords : [coords.x, coords.y];
    return new Vec2({ x, y });
  });

  // #region Fields
  #x: number;
  #y: number;

  public get x(): number {
    return this.#x;
  }

  public set x(value: number) {
    if (value === this.#x) return;

    const previous = this.bare();
    this.#x = value;

    this.emit("changed", this, previous);
    this.emit("x", value, previous.x);
  }

  public get y(): number {
    return this.#y;
  }

  public set y(value: number) {
    if (value === this.#y) return;

    const previous = this.bare();
    this.#y = value;

    this.emit("changed", this, previous);
    this.emit("y", value, previous.y);
  }
  // #endregion

  public constructor(vector: IVec2) {
    super();

    this.#x = vector.x;
    this.#y = vector.y;
  }

  /**
   * Creates a vector with all elements set to {@link value}.
   */
  public static splat(value: number): Vec2 {
    return new Vec2({ x: value, y: value });
  }

  public clone(this: Vec2): Vec2 {
    return new Vec2({ x: this.#x, y: this.#y });
  }

  public bare(this: Vec2): IVec2 {
    return { x: this.#x, y: this.#y };
  }

  public assign(this: Vec2, value: Partial<IVec2>): boolean {
    // Ensure at least one component has changed
    const xChanged = value.x !== undefined && value.x !== this.#x;
    const yChanged = value.y !== undefined && value.y !== this.#y;

    if (!xChanged && !yChanged) return false;
    const prev = this.bare();

    if (value.x !== undefined && xChanged) {
      this.#x = value.x;
      this.emit("x", this.#x, prev.x);
    }

    if (value.y !== undefined && yChanged) {
      this.#y = value.y;
      this.emit("y", this.#y, prev.y);
    }

    this.emit("changed", this, prev);
    return true;
  }

  // #region Methods
  // #region Absolute
  public static abs(vector: IVec2): IVec2 {
    return { x: Math.abs(vector.x), y: Math.abs(vector.y) };
  }

  /**
   * Returns a vector containing the absolute value of each element.
   */
  public abs(this: Vec2): Vec2 {
    return new Vec2(Vec2.abs(this));
  }
  // #endregion

  // #region Negate
  public static neg(vector: IVec2): IVec2 {
    return { x: -vector.x, y: -vector.y };
  }

  public neg(this: Vec2): Vec2 {
    return new Vec2(Vec2.neg(this));
  }
  // #endregion

  // #region Add
  public static add(a: IVec2, b: IVec2): IVec2 {
    return { x: a.x + b.x, y: a.y + b.y };
  }

  public add(this: Vec2, other: IVec2): Vec2 {
    return new Vec2(Vec2.add(this, other));
  }
  // #endregion

  // #region Subtract
  public static sub(a: IVec2, b: IVec2): IVec2 {
    return { x: a.x - b.x, y: a.y - b.y };
  }

  public sub(this: Vec2, other: IVec2): Vec2 {
    return new Vec2(Vec2.sub(this, other));
  }
  // #endregion

  // #region Multiply
  public static mul(a: IVec2, b: IVec2 | number): IVec2 {
    if (typeof b === "number") {
      return { x: a.x * b, y: a.y * b };
    }

    return { x: a.x * b.x, y: a.y * b.y };
  }

  public mul(this: Vec2, other: IVec2 | number): Vec2 {
    return new Vec2(Vec2.mul(this, other));
  }
  // #endregion

  // #region Divide
  public static div(a: IVec2, b: IVec2 | number): IVec2 {
    if (typeof b === "number") {
      return { x: a.x / b, y: a.y / b };
    }

    return { x: a.x / b.x, y: a.y / b.y };
  }

  public div(this: Vec2, other: IVec2 | number): Vec2 {
    return new Vec2(Vec2.div(this, other));
  }
  // #endregion

  // #region Magnitude
  /**
   * Returns the magnitude (length) of a vector.
   */
  public static magnitude(vector: IVec2): number {
    return Math.hypot(vector.x, vector.y);
  }

  /**
   * Returns the magnitude (length) of this vector.
   */
  public magnitude(this: Vec2): number {
    return Vec2.magnitude(this);
  }
  // #endregion

  // #region Magnitude Squared
  /**
   * Returns the squared magnitude (length) of a vector.
   */
  public static magnitudeSquared(vector: IVec2): number {
    return vector.x ** 2 + vector.y ** 2;
  }

  /**
   * Returns the squared magnitude (length) of this vector.
   */
  public magnitudeSquared(this: Vec2): number {
    return Vec2.magnitudeSquared(this);
  }
  // #endregion

  // #region Normalize
  /**
   * Returns a new vector with the magnitude (length) normalized to 1.
   */
  public static normalize(vector: IVec2): IVec2 {
    const magnitude = Vec2.magnitude(vector);
    if (magnitude === 0) return { ...Vec2.ZERO };

    return {
      x: vector.x / magnitude,
      y: vector.y / magnitude,
    };
  }

  /**
   * Returns a new vector with the magnitude (length) normalized to 1.
   */
  public normalize(this: Vec2): Vec2 {
    return new Vec2(Vec2.normalize(this));
  }
  // #endregion

  // #region Lerp
  /**
   * Framerate independent smooth linear interpolation.
   *
   * @param current Current value
   * @param target Target value
   * @param deltaTime Delta time (seconds)
   * @param halfLife Time until halfway (seconds)
   */
  public static lerp(
    current: IVec2,
    target: IVec2,
    deltaTime: number,
    halfLife: number,
    epsilon: number = EPSILON,
  ): IVec2 {
    return {
      x: lerp(current.x, target.x, deltaTime, halfLife, epsilon),
      y: lerp(current.y, target.y, deltaTime, halfLife, epsilon),
    };
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
  public toJSON(): IVec2 {
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
