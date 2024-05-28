import slugify from "npm:@sindresorhus/slugify@2.2.1";
import type { Integer } from "../_deps/type-fest.ts";
import type { ZodSchema } from "../_deps/zod.ts";
import { z } from "../_deps/zod.ts";
import { ReadonlyEmitter } from "../events/readonly_emitter.ts";
import type { EntityContext } from "./entity.ts";

// #region Value Classes
// #region Value
export interface ValueOptions<T> {
  /**
   * Value name.
   *
   * Must be unique for each value per entity.
   */
  readonly name: string;

  /**
   * Default value.
   */
  readonly default: T;

  /**
   * Disable syncing for this value.
   */
  readonly local?: boolean;
}

export type ValueEvents<T> = {
  readonly changed: [value: T, previous: T];
  readonly sync: [value: T]; // TODO: Sync options
};

export abstract class Value<T> extends ReadonlyEmitter<ValueEvents<T>> {
  public readonly name: string;
  public get slug(): string {
    return slugify(this.name);
  }

  public readonly local: boolean;
  #value: T;

  constructor(initial: T, options: ValueOptions<T>) {
    super();

    this.name = options.name;
    this.local = options.local ?? false;
    this.#value = initial;
  }

  public get value(): T {
    return this.#value;
  }

  public set value(value: T) {
    if (value === this.#value) return;

    const previous = this.#value;
    this.#value = value;
    this.emit("changed", value, previous);

    if (!this.local) this.emit("sync", value);
  }

  #schema: ZodSchema | undefined;
  protected abstract _schema(): ZodSchema;

  public get schema(): ZodSchema {
    if (!this.#schema) this.#schema = this._schema();
    return this.#schema;
  }
}
// #endregion

// #region Boolean
export class BooleanValue extends Value<boolean> {
  public static type: boolean;

  protected _schema(): ZodSchema {
    return z.boolean();
  }
}
// #endregion

// #region Number
export interface NumberOptions extends ValueOptions<number> {
  readonly min?: number;
  readonly max?: number;
}

export class NumberValue extends Value<number> {
  public static type: number;

  public readonly min: number | undefined;
  public readonly max: number | undefined;

  public constructor(initial: number, options: NumberOptions) {
    super(initial, options);

    this.min = options.min;
    this.max = options.max;
  }

  protected _schema(): ZodSchema {
    let schema = z.number();
    if (this.min) schema = schema.min(this.min);
    if (this.max) schema = schema.max(this.max);

    return schema;
  }
}
// #endregion

// #region Integer
export interface IntegerOptions extends ValueOptions<Integer<number>> {
  readonly min?: Integer<number>;
  readonly max?: Integer<number>;
}

export class IntegerValue extends Value<Integer<number>> {
  public static type: Integer<number>;

  public readonly min: Integer<number> | undefined;
  public readonly max: Integer<number> | undefined;

  public constructor(initial: Integer<number>, options: IntegerOptions) {
    super(initial, options);

    this.min = options.min;
    this.max = options.max;
  }

  protected _schema(): ZodSchema {
    let schema = z.number().int();
    if (this.min) schema = schema.min(this.min);
    if (this.max) schema = schema.max(this.max);

    return schema;
  }
}
// #endregion

// #region String
export interface StringOptions extends ValueOptions<string> {
  readonly min?: Integer<number>;
  readonly max?: Integer<number>;
}

export class StringValue extends Value<string> {
  public static type: string;

  public readonly min: Integer<number> | undefined;
  public readonly max: Integer<number> | undefined;

  public constructor(initial: string, options: StringOptions) {
    super(initial, options);

    this.min = options.min;
    this.max = options.max;
  }

  protected _schema(): ZodSchema {
    let schema = z.number().int();
    if (this.min) schema = schema.min(this.min);
    if (this.max) schema = schema.max(this.max);

    return schema;
  }
}
// #endregion
// #endregion

export class Values {
  #values: Record<string, unknown>;
  #created = new Map<string, Value<unknown>>();

  public constructor(ctx: EntityContext) {
    this.#values = ctx.values;
  }

  private _destroy(): void {
    for (const value of this.#created.values()) {
      value.removeAllListeners();
    }

    this.#created.clear();
  }

  private value<V extends Value<T>, T, O extends ValueOptions<T>>(
    options: O,
    create: (initial: T, options: O) => V,
    validate: (v: unknown) => v is T,
  ): V {
    const name = options.name;
    const slug = slugify(name);
    if (this.#created.has(slug)) {
      throw new Error(`value already created: ${name}`);
    }

    const initial = slug in this.#values ? this.#values[slug] : options.default;
    const valid = validate(initial);
    if (!valid) {
      throw new Error("invalid value");
    }

    const value = create(initial, options);
    // @ts-expect-error generic narrowing
    this.#created.set(slug, value);

    return value;
  }

  public boolean(options: ValueOptions<boolean>): BooleanValue {
    return this.value<BooleanValue, boolean, ValueOptions<boolean>>(
      options,
      (initial, options) => new BooleanValue(initial, options),
      (value): value is boolean => {
        if (typeof value !== "boolean") {
          throw new Error("value is not a boolean");
        }

        return true;
      },
    );
  }

  public number(options: NumberOptions): NumberValue {
    return this.value<NumberValue, number, NumberOptions>(
      options,
      (initial, options) => new NumberValue(initial, options),
      (value): value is number => {
        if (typeof value !== "number") {
          throw new Error("value is not a number");
        }

        return true;
      },
    );
  }

  public integer(options: IntegerOptions): IntegerValue {
    return this.value<IntegerValue, Integer<number>, IntegerOptions>(
      options,
      (initial, options) => new IntegerValue(initial, options),
      (value): value is Integer<number> => {
        if (typeof value !== "number" || !Number.isInteger(value)) {
          throw new Error("value is not an integer");
        }

        return true;
      },
    );
  }

  public string(options: StringOptions): StringValue {
    return this.value<StringValue, string, StringOptions>(
      options,
      (initial, options) => new StringValue(initial, options),
      (value): value is string => {
        if (typeof value !== "string") {
          throw new Error("value is not a string");
        }

        return true;
      },
    );
  }
}
