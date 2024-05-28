import { z } from "../_deps/zod.ts";
import { ReadonlyEmitter } from "../events/mod.ts";
import { EPSILON, lerp } from "./lerp.ts";
import { Vector, VectorEvents } from "./vector.ts";

export type ReadonlyIVec3 = Readonly<IVec3>;
export interface IVec3 {
  x: number;
  y: number;
  z: number;
}

export type Vec3Events = VectorEvents<IVec3, Vec3>;
export class Vec3 extends ReadonlyEmitter<Vec3Events>
  implements IVec3, Vector<IVec3, Vec3> {
  // #region Constants
  /** All zeroes. */
  public static readonly ZERO: Readonly<IVec3> = Object.freeze({
    x: 0,
    y: 0,
    z: 0,
  });
  /** All ones. */
  public static readonly ONE: Readonly<IVec3> = Object.freeze({
    x: 1,
    y: 1,
    z: 1,
  });
  /** All negative ones. */
  public static readonly NEG_ONE: Readonly<IVec3> = Object.freeze({
    x: -1,
    y: -1,
    z: -1,
  });
  /** A unit vector pointing along the positive X axis. */
  public static readonly X: Readonly<IVec3> = Object.freeze({
    ...Vec3.ZERO,
    x: 1,
  });
  /** A unit vector pointing along the positive Y axis. */
  public static readonly Y: Readonly<IVec3> = Object.freeze({
    ...Vec3.ZERO,
    y: 1,
  });
  /** A unit vector pointing along the positive Z axis. */
  public static readonly Z: Readonly<IVec3> = Object.freeze({
    ...Vec3.ZERO,
    z: 1,
  });
  /** A unit vector pointing along the negative X axis. */
  public static readonly NEG_X: Readonly<IVec3> = Object.freeze({
    ...Vec3.ZERO,
    x: -1,
  });
  /** A unit vector pointing along the negative Y axis. */
  public static readonly NEG_Y: Readonly<IVec3> = Object.freeze({
    ...Vec3.ZERO,
    y: -1,
  });
  /** A unit vector pointing along the negative Z axis. */
  public static readonly NEG_Z: Readonly<IVec3> = Object.freeze({
    ...Vec3.ZERO,
    z: -1,
  });
  // #endregion

  public static schema = z.object({
    x: z.number(),
    y: z.number(),
    z: z.number(),
  }).or(
    z.tuple([z.number(), z.number(), z.number()]),
  ).transform((coords) => {
    const [x, y, z] = Array.isArray(coords)
      ? coords
      : [coords.x, coords.y, coords.z];

    return new Vec3({ x, y, z });
  });

  // #region Fields
  #x: number;
  #y: number;
  #z: number;

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
  // #endregion

  public constructor(vector: IVec3) {
    super();

    this.#x = vector.x;
    this.#y = vector.y;
    this.#z = vector.z;
  }

  /**
   * Creates a vector with all elements set to {@link value}.
   */
  public static splat(value: number): Vec3 {
    return new Vec3({ x: value, y: value, z: value });
  }

  public clone(this: Vec3): Vec3 {
    return new Vec3({ x: this.#x, y: this.#y, z: this.#z });
  }

  public bare(this: Vec3): IVec3 {
    return { x: this.#x, y: this.#y, z: this.#z };
  }

  public assign(this: Vec3, value: Partial<IVec3>): boolean {
    // Ensure at least one component has changed
    const xChanged = value.x !== undefined && value.x !== this.#x;
    const yChanged = value.y !== undefined && value.y !== this.#y;
    const zChanged = value.z !== undefined && value.z !== this.#z;

    if (!xChanged && !yChanged && !zChanged) return false;
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

    this.emit("changed", this, prev);
    return true;
  }

  // #region Methods
  // #region Absolute
  public static abs(vector: IVec3): IVec3 {
    return {
      x: Math.abs(vector.x),
      y: Math.abs(vector.y),
      z: Math.abs(vector.z),
    };
  }

  /**
   * Returns a vector containing the absolute value of each element.
   */
  public abs(this: Vec3): Vec3 {
    return new Vec3(Vec3.abs(this));
  }
  // #endregion

  // #region Negate
  public static neg(vector: IVec3): IVec3 {
    return { x: -vector.x, y: -vector.y, z: -vector.z };
  }

  public neg(this: Vec3): Vec3 {
    return new Vec3(Vec3.neg(this));
  }
  // #endregion

  // #region Add
  public static add(a: IVec3, b: IVec3): IVec3 {
    return {
      x: a.x + b.x,
      y: a.y + b.y,
      z: a.z + b.z,
    };
  }

  public add(this: Vec3, other: IVec3): Vec3 {
    return new Vec3(Vec3.add(this, other));
  }
  // #endregion

  // #region Subtract
  public static sub(a: IVec3, b: IVec3): IVec3 {
    return {
      x: a.x - b.x,
      y: a.y - b.y,
      z: a.z - b.z,
    };
  }

  public sub(this: Vec3, other: IVec3): Vec3 {
    return new Vec3(Vec3.sub(this, other));
  }
  // #endregion

  // #region Multiply
  public static mul(a: IVec3, b: IVec3 | number): IVec3 {
    if (typeof b === "number") {
      return {
        x: a.x * b,
        y: a.y * b,
        z: a.z * b,
      };
    }

    return {
      x: a.x * b.x,
      y: a.y * b.y,
      z: a.z * b.z,
    };
  }

  public mul(this: Vec3, other: IVec3 | number): Vec3 {
    return new Vec3(Vec3.mul(this, other));
  }
  // #endregion

  // #region Divide
  public static div(a: IVec3, b: IVec3 | number): IVec3 {
    if (typeof b === "number") {
      return {
        x: a.x / b,
        y: a.y / b,
        z: a.z / b,
      };
    }

    return {
      x: a.x / b.x,
      y: a.y / b.y,
      z: a.z / b.z,
    };
  }

  public div(this: Vec3, other: IVec3 | number): Vec3 {
    return new Vec3(Vec3.div(this, other));
  }
  // #endregion

  // #region Magnitude
  /**
   * Returns the magnitude (length) of a vector.
   */
  public static magnitude(vector: IVec3): number {
    return Math.hypot(vector.x, vector.y, vector.z);
  }

  /**
   * Returns the magnitude (length) of this vector.
   */
  public magnitude(this: Vec3): number {
    return Vec3.magnitude(this);
  }
  // #endregion

  // #region Magnitude Squared
  /**
   * Returns the squared magnitude (length) of a vector.
   */
  public static magnitudeSquared(vector: IVec3): number {
    return vector.x ** 2 + vector.y ** 2 + vector.z ** 2;
  }

  /**
   * Returns the squared magnitude (length) of this vector.
   */
  public magnitudeSquared(this: Vec3): number {
    return Vec3.magnitudeSquared(this);
  }
  // #endregion

  // #region Normalize
  /**
   * Returns a new vector with the magnitude (length) normalized to 1.
   */
  public static normalize(vector: IVec3): IVec3 {
    const magnitude = Vec3.magnitude(vector);
    if (magnitude === 0) return { ...Vec3.ZERO };

    return {
      x: vector.x / magnitude,
      y: vector.y / magnitude,
      z: vector.z / magnitude,
    };
  }

  /**
   * Returns a new vector with the magnitude (length) normalized to 1.
   */
  public normalize(this: Vec3): Vec3 {
    return new Vec3(Vec3.normalize(this));
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
    current: IVec3,
    target: IVec3,
    deltaTime: number,
    halfLife: number,
    epsilon: number = EPSILON,
  ): IVec3 {
    return {
      x: lerp(current.x, target.x, deltaTime, halfLife, epsilon),
      y: lerp(current.y, target.y, deltaTime, halfLife, epsilon),
      z: lerp(current.z, target.z, deltaTime, halfLife, epsilon),
    };
  }
  // #endregion
  // #endregion

  /**
   * @ignore
   */
  public toString(): string {
    return `Vec3 { x: ${this.#x}, y: ${this.#y}, z: ${this.#z} }`;
  }

  /**
   * @ignore
   */
  public toJSON(): IVec3 {
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
