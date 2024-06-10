import { vectorOnChanged } from "../../internal.ts";
import { EPSILON, lerp, smoothLerp } from "../lerp.ts";
import type { Vector } from "./_vector.ts";

export interface IVector2 {
  x: number;
  y: number;
}

export class Vector2 implements IVector2, Vector<IVector2, Vector2> {
  [vectorOnChanged]: () => void = () => {};

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
    this[vectorOnChanged]();
  }

  public get y(): number {
    return this.#y;
  }

  public set y(value: number) {
    if (value === this.#y) return;

    this.#y = value;
    this[vectorOnChanged]();
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

    this[vectorOnChanged]();
    return true;
  }

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

  // #region Lerp
  public static lerp(a: IVector2, b: IVector2, t: number): Vector2 {
    return new Vector2(lerp(a.x, b.x, t), lerp(a.y, b.y, t));
  }

  public static smoothLerp(
    current: Vector2,
    target: Vector2,
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
