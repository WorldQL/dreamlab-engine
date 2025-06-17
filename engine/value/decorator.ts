import type {
  Behavior,
  BehaviorConstructor,
  BehaviorValueOpts,
  ValueTypeTag,
} from "@dreamlab/engine";
import * as internal from "@dreamlab/engine/internal";
import { Except } from "@dreamlab/vendor/type-fest.ts";

// deno-lint-ignore no-unused-vars
import type { EntityRef, Vector2Adapter } from "@dreamlab/engine"; // this is used in jsdoc

type ValuesToDefine = Map<string, BehaviorValueOpts<unknown>>;

/**
 * Makes the following class property visible in the inspector and synced over the network.
 *
 * Accepts an adapter such as {@link EntityRef}, {@link Vector2Adapter}, etc.
 *
 * https://docs.dreamlab.gg/guide/Synced-Values-and-Adapters
 */
export function value<B extends Behavior, T>(
  opts?: Except<BehaviorValueOpts<T>, "hidden"> & { hidden?: boolean },
): (_: undefined, ctx: ClassFieldDecoratorContext<B, T>) => void {
  return function (_, ctx): void {
    if (typeof ctx.name !== "string") return;
    if (ctx.static) return;

    const name = ctx.name;
    ctx.addInitializer(function () {
      // const ctor = this.constructor as BehaviorConstructor<B>;
      const _opts = { type: opts?.type, ...opts };
      if (_opts.type === undefined) delete _opts.type;

      // we could just do this but initializers run before the constructor and idk about the ramifications
      // this.defineValue(ctor, name, _opts);

      if (!(internal.defineValuesProperties in this)) {
        Object.defineProperty(this, internal.defineValuesProperties, {
          value: new Map() as ValuesToDefine,
          writable: true,
          configurable: false,
          enumerable: false,
        });
      }

      // somewhat redundant check to make the TS compiler happy lol
      if (internal.defineValuesProperties in this) {
        const toDefine = this[internal.defineValuesProperties] as ValuesToDefine;
        toDefine.set(name, _opts);
      } else {
        throw new Error("oh no");
      }
    });
  };
}

/** Use {@link value|@value} instead. This is alternative syntax that allows you to pass the type as the first argument. */
export function syncedValue<B extends Behavior, T>(
  adapterType?: ValueTypeTag<T>,
  opts?: Except<BehaviorValueOpts<T>, "type" | "hidden"> & {
    hidden?: boolean;
  },
): (_: undefined, ctx: ClassFieldDecoratorContext<B, T>) => void {
  return value({ type: adapterType, ...opts });
}

export function setupSyncedValues(behavior: Behavior): void {
  const ctor = behavior.constructor as BehaviorConstructor;

  if (internal.defineValuesProperties in behavior) {
    const valuesToDefine = behavior[internal.defineValuesProperties] as ValuesToDefine;
    for (const [name, opts] of valuesToDefine) {
      // @ts-expect-error: props are never on base behavior
      behavior.defineValue(ctor, name, opts);
    }
  }
}
