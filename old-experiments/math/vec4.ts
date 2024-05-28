import { z } from "../_deps/zod.ts";
import { ReadonlyEmitter } from "../events/mod.ts";
import { EPSILON, lerp } from "./lerp.ts";
import { Vector, VectorEvents } from "./vector.ts";

export type ReadonlyIVec4 = Readonly<IVec4>;
export interface IVec4 {
  x: number;
  y: number;
  z: number;
  w: number;
}

export type Vec4Events = VectorEvents<IVec4, Vec4>;
export class Vec4 extends ReadonlyEmitter<Vec4Events>
  implements IVec4, Vector<IVec4, Vec4> {
  // #region Constants
  /** All zeroes. */
  public static readonly ZERO: Readonly<IVec4> = Object.freeze({
    x: 0,
    y: 0,
    z: 0,
    w: 0,
  });
  /** All ones. */
  public static readonly ONE: Readonly<IVec4> = Object.freeze({
    x: 1,
    y: 1,
    z: 1,
    w: 1,
  });
  /** All negative ones. */
  public static readonly NEG_ONE: Readonly<IVec4> = Object.freeze({
    x: -1,
    y: -1,
    z: -1,
    w: -1,
  });
  /** A unit vector pointing along the positive X axis. */
  public static readonly X: Readonly<IVec4> = Object.freeze({
    ...Vec4.ZERO,
    x: 1,
  });
  /** A unit vector pointing along the positive Y axis. */
  public static readonly Y: Readonly<IVec4> = Object.freeze({
    ...Vec4.ZERO,
    y: 1,
  });
  /** A unit vector pointing along the positive Z axis. */
  public static readonly Z: Readonly<IVec4> = Object.freeze({
    ...Vec4.ZERO,
    z: 1,
  });
  /** A unit vector pointing along the positive W axis. */
  public static readonly W: Readonly<IVec4> = Object.freeze({
    ...Vec4.ZERO,
    w: 1,
  });
  /** A unit vector pointing along the negative X axis. */
  public static readonly NEG_X: Readonly<IVec4> = Object.freeze({
    ...Vec4.ZERO,
    x: -1,
  });
  /** A unit vector pointing along the negative Y axis. */
  public static readonly NEG_Y: Readonly<IVec4> = Object.freeze({
    ...Vec4.ZERO,
    y: -1,
  });
  /** A unit vector pointing along the negative Z axis. */
  public static readonly NEG_Z: Readonly<IVec4> = Object.freeze({
    ...Vec4.ZERO,
    z: -1,
  });
  /** A unit vector pointing along the negative W axis. */
  public static readonly NEG_W: Readonly<IVec4> = new Vec4({
    ...Vec4.ZERO,
    w: -1,
  });
  // #endregion

  public static schema = z.object({
    x: z.number(),
    y: z.number(),
    z: z.number(),
    w: z.number(),
  }).or(
    z.tuple([z.number(), z.number(), z.number(), z.number()]),
  ).transform((coords) => {
    const [x, y, z, w] = Array.isArray(coords)
      ? coords
      : [coords.x, coords.y, coords.z, coords.w];

    return new Vec4({ x, y, z, w });
  });

  // #region Fields
  #x: number;
  #y: number;
  #z: number;
  #w: number;

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

  public get z(): number {
    return this.#z;
  }

  public set z(value: number) {
    if (value === this.#z) return;

    const previous = this.bare();
    this.#z = value;

    this.emit("changed", this, previous);
    this.emit("z", value, previous.z);
  }

  public get w(): number {
    return this.#w;
  }

  public set w(value: number) {
    if (value === this.#w) return;

    const previous = this.bare();
    this.#w = value;

    this.emit("changed", this, previous);
    this.emit("w", value, previous.w);
  }
  // #endregion

  public constructor(vector: IVec4) {
    super();

    this.#x = vector.x;
    this.#y = vector.y;
    this.#z = vector.z;
    this.#w = vector.w;
  }

  /**
   * Creates a vector with all elements set to {@link value}.
   */
  public static splat(value: number): Vec4 {
    return new Vec4({ x: value, y: value, z: value, w: value });
  }

  public clone(this: Vec4): Vec4 {
    return new Vec4({ x: this.#x, y: this.#y, z: this.#z, w: this.#w });
  }

  public bare(this: Vec4): IVec4 {
    return { x: this.#x, y: this.#y, z: this.#z, w: this.#w };
  }

  public assign(this: Vec4, value: Partial<IVec4>): boolean {
    // Ensure at least one component has changed
    const xChanged = value.x !== undefined && value.x !== this.#x;
    const yChanged = value.y !== undefined && value.y !== this.#y;
    const zChanged = value.z !== undefined && value.z !== this.#z;
    const wChanged = value.w !== undefined && value.w !== this.#w;

    if (!xChanged && !yChanged && !zChanged && !wChanged) return false;
    const prev = this.bare();

    if (value.x !== undefined && xChanged) {
      this.#x = value.x;
      this.emit("x", this.#x, prev.x);
    }

    if (value.y !== undefined && yChanged) {
      this.#y = value.y;
      this.emit("y", this.#y, prev.y);
    }

    if (value.z !== undefined && zChanged) {
      this.#z = value.z;
      this.emit("z", this.#z, prev.z);
    }

    if (value.w !== undefined && wChanged) {
      this.#w = value.w;
      this.emit("w", this.#w, prev.w);
    }

    this.emit("changed", this, prev);
    return true;
  }

  // #region Methods
  // #region Absolute
  public static abs(vector: IVec4): IVec4 {
    return {
      x: Math.abs(vector.x),
      y: Math.abs(vector.y),
      z: Math.abs(vector.z),
      w: Math.abs(vector.w),
    };
  }

  /**
   * Returns a vector containing the absolute value of each element.
   */
  public abs(this: Vec4): Vec4 {
    return new Vec4(Vec4.abs(this));
  }
  // #endregion

  // #region Negate
  public static neg(vector: IVec4): IVec4 {
    return { x: -vector.x, y: -vector.y, z: -vector.z, w: -vector.w };
  }

  public neg(this: Vec4): Vec4 {
    return new Vec4(Vec4.neg(this));
  }
  // #endregion

  // #region Add
  public static add(a: IVec4, b: IVec4): IVec4 {
    return {
      x: a.x + b.x,
      y: a.y + b.y,
      z: a.z + b.z,
      w: a.w + b.w,
    };
  }

  public add(this: Vec4, other: IVec4): Vec4 {
    return new Vec4(Vec4.add(this, other));
  }
  // #endregion

  // #region Subtract
  public static sub(a: IVec4, b: IVec4): IVec4 {
    return {
      x: a.x - b.x,
      y: a.y - b.y,
      z: a.z - b.z,
      w: a.w - b.w,
    };
  }

  public sub(this: Vec4, other: IVec4): Vec4 {
    return new Vec4(Vec4.sub(this, other));
  }
  // #endregion

  // #region Multiply
  public static mul(a: IVec4, b: IVec4 | number): IVec4 {
    if (typeof b === "number") {
      return {
        x: a.x * b,
        y: a.y * b,
        z: a.z * b,
        w: a.w * b,
      };
    }

    return {
      x: a.x * b.x,
      y: a.y * b.y,
      z: a.z * b.z,
      w: a.w * b.w,
    };
  }

  public mul(this: Vec4, other: IVec4 | number): Vec4 {
    return new Vec4(Vec4.mul(this, other));
  }
  // #endregion

  // #region Divide
  public static div(a: IVec4, b: IVec4 | number): IVec4 {
    if (typeof b === "number") {
      return {
        x: a.x / b,
        y: a.y / b,
        z: a.z / b,
        w: a.w / b,
      };
    }

    return {
      x: a.x / b.x,
      y: a.y / b.y,
      z: a.z / b.z,
      w: a.w / b.w,
    };
  }

  public div(this: Vec4, other: IVec4 | number): Vec4 {
    return new Vec4(Vec4.div(this, other));
  }
  // #endregion

  // #region Magnitude
  /**
   * Returns the magnitude (length) of a vector.
   */
  public static magnitude(vector: IVec4): number {
    return Math.hypot(vector.x, vector.y, vector.z, vector.w);
  }

  /**
   * Returns the magnitude (length) of this vector.
   */
  public magnitude(this: Vec4): number {
    return Vec4.magnitude(this);
  }
  // #endregion

  // #region Magnitude Squared
  /**
   * Returns the squared magnitude (length) of a vector.
   */
  public static magnitudeSquared(vector: IVec4): number {
    return vector.x ** 2 + vector.y ** 2 + vector.z ** 2 + vector.w ** 2;
  }

  /**
   * Returns the squared magnitude (length) of this vector.
   */
  public magnitudeSquared(this: Vec4): number {
    return Vec4.magnitudeSquared(this);
  }
  // #endregion

  // #region Normalize
  /**
   * Returns a new vector with the magnitude (length) normalized to 1.
   */
  public static normalize(vector: IVec4): IVec4 {
    const magnitude = Vec4.magnitude(vector);
    if (magnitude === 0) return { ...Vec4.ZERO };

    return {
      x: vector.x / magnitude,
      y: vector.y / magnitude,
      z: vector.z / magnitude,
      w: vector.w / magnitude,
    };
  }

  /**
   * Returns a new vector with the magnitude (length) normalized to 1.
   */
  public normalize(this: Vec4): Vec4 {
    return new Vec4(Vec4.normalize(this));
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
    current: IVec4,
    target: IVec4,
    deltaTime: number,
    halfLife: number,
    epsilon: number = EPSILON,
  ): IVec4 {
    return {
      x: lerp(current.x, target.x, deltaTime, halfLife, epsilon),
      y: lerp(current.y, target.y, deltaTime, halfLife, epsilon),
      z: lerp(current.z, target.z, deltaTime, halfLife, epsilon),
      w: lerp(current.w, target.w, deltaTime, halfLife, epsilon),
    };
  }
  // #endregion
  // #endregion

  /**
   * @ignore
   */
  public toString(): string {
    return `Vec4 { x: ${this.#x}, y: ${this.#y}, z: ${this.#z}, w: ${this.#w} }`;
  }

  /**
   * @ignore
   */
  public toJSON(): IVec4 {
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
