// deno-lint-ignore-file no-explicit-any
import { generateCUID } from "@dreamlab/vendor/cuid.ts";
import type { ConditionalExcept } from "@dreamlab/vendor/type-fest.ts";

import { Entity } from "../entity/mod.ts";
import { Game } from "../game.ts";
import * as internal from "../internal.ts";
import {
  DefaultSignalHandlerImpls,
  ISignalHandler,
  Signal,
  SignalConstructor,
  SignalListener,
  SignalMatching,
  SignalSubscription,
} from "../signal.ts";
import {
  BehaviorDescendantDestroyed,
  BehaviorDescendantSpawned,
  BehaviorDestroyed,
  BehaviorSpawned,
} from "../signals/behavior-lifecycle.ts";
import { GamePostTick, GamePreTick, GameRender } from "../signals/game-events.ts";
import { EntityEnableChanged } from "../signals/mod.ts";
import {
  AdapterTypeTag,
  JsonValue,
  Primitive,
  Value,
  ValueTypeAdapter,
  ValueTypeTag,
  inferValueTypeTag,
} from "../value/mod.ts";

export interface BehaviorContext {
  game: Game;
  entity: Entity;
  ref?: string;
  values?: Record<string, Primitive>;
}

export type BehaviorConstructor<B extends Behavior = Behavior> = (new (
  ctx: BehaviorContext,
) => B) & {
  onLoaded?(game: Game): void;
};

// prettier-ignore

export interface BehaviorDefinition<B extends Behavior = Behavior> {
  type: BehaviorConstructor<B>;
  values?: Partial<Omit<B, keyof Behavior>>;
  _ref?: string;
}

type BehaviorValueProp<B extends Behavior> = Exclude<
  // deno-lint-ignore ban-types
  keyof ConditionalExcept<B, Function>,
  keyof Behavior
>;
type BehaviorValueOpts<B extends Behavior, P extends BehaviorValueProp<B>> = {
  type?: ValueTypeTag<B[P]>;
  description?: string;
  replicated?: boolean;
};

// TODO: Fix adapterType type. Can't quite get it to work in browser editor.
// export function syncedValue(adapterType?: ValueTypeAdapter<any>) {
export function syncedValue(adapterType?: any) {
  return function (target: any, propertyKey: string) {
    if (!target.constructor[internal.defineValuesProperties]) {
      Object.defineProperty(target.constructor, internal.defineValuesProperties, {
        value: [],
        writable: true,
        configurable: false,
        enumerable: false,
      });
    }

    target.constructor[internal.defineValuesProperties].push({ propertyKey, adapterType });
  };
}

export class Behavior implements ISignalHandler {
  readonly game: Game;
  readonly entity: Entity;

  protected get time() {
    return this.game.time;
  }
  protected get inputs() {
    return this.game.inputs;
  }

  readonly ref: string = generateCUID("bhv");

  // #region Values
  #defaultValues: Record<string, unknown> = {};
  #values = new Map<string, Value>();
  get values(): ReadonlyMap<string, Value> {
    return this.#values;
  }

  defineValues<B extends Behavior, Props extends (BehaviorValueProp<B> & string)[]>(
    eType: BehaviorConstructor<B>,
    ...props: {
      [I in keyof Props]: Props[I] extends BehaviorValueProp<B> ? Props[I] : never;
    }
  ) {
    for (const prop of props) {
      this.defineValue(eType, prop);
    }
  }

  defineValue<B extends Behavior>(
    bType: BehaviorConstructor<B>, // can't just be `this` because TypeScript :(
    prop: BehaviorValueProp<B> & string,
    opts: BehaviorValueOpts<B, typeof prop> = {},
  ): Value<B[typeof prop]> {
    if (!(this instanceof bType))
      throw new TypeError(`${this.constructor} is not an instance of ${bType}`);

    const identifier = `${this.entity.ref}/${this.ref}/${prop}`;
    if (this.#values.has(identifier))
      throw new Error(`A value with the identifier '${identifier}' already exists!`);

    type T = B[typeof prop];
    type T_ = Value<T>["value"];
    const originalValue: T_ = this[prop] as T_;
    let defaultValue: T_ = originalValue;

    let adapter: ValueTypeAdapter<T> | undefined;
    if (opts.type && (opts.type as AdapterTypeTag<T>).prototype instanceof ValueTypeAdapter) {
      adapter = new (opts.type as AdapterTypeTag<T>)(this.game, undefined);
    }

    if (this.#defaultValues[prop] !== undefined) {
      if (adapter) {
        defaultValue = (
          adapter.isValue(this.#defaultValues[prop])
            ? this.#defaultValues[prop]
            : adapter.convertFromPrimitive(this.#defaultValues[prop] as JsonValue)
        ) as T_;
      } else {
        defaultValue = this.#defaultValues[prop] as T_;
      }
    }

    const original = Object.getOwnPropertyDescriptor(Object.getPrototypeOf(this), prop);
    const _get = original?.get?.bind(this);
    const _set = original?.set?.bind(this);

    // TODO: deep equality check?
    if (defaultValue !== originalValue) _set?.(defaultValue);

    const value = new Value<T>(
      this.game.values,
      identifier,
      defaultValue,
      opts.type ?? (inferValueTypeTag(defaultValue) as ValueTypeTag<B[typeof prop]>),
      opts.description ?? prop, // TODO: autogenerate description (fix casing & spacing)
      adapter,
    );
    if (opts.replicated) value.replicated = opts.replicated;
    value[internal.valueRelatedEntity] = this.entity;

    Object.defineProperty(this, prop, {
      configurable: true,
      enumerable: true,
      set: v => {
        if (_set) _set(v);

        if (_get) value.value = _get();
        else value.value = v;
      },
      get: () => value.value,
    });

    this.#values.set(prop, value as Value<unknown>);

    return value;
  }
  // #endregion

  // #region External Listeners
  readonly externalListeners: SignalSubscription<any>[] = [];

  protected listen<S extends Signal, T extends ISignalHandler>(
    receiver: T,
    signalType: SignalConstructor<SignalMatching<S, T>>,
    signalListener: SignalListener<SignalMatching<S, T>>,
  ): SignalSubscription<S> {
    const listenerOwnedByThis = Object.values(
      Object.getOwnPropertyDescriptors(this.constructor.prototype),
    )
      .map(t => t.value)
      .includes(signalListener);
    const boundSignalListener = listenerOwnedByThis
      ? signalListener.bind(this)
      : signalListener;

    const subscription = receiver.on(signalType, boundSignalListener);
    this.externalListeners.push(subscription);
    return subscription;
  }
  // #endregion

  // #region Signals
  readonly signalSubscriptionMap = DefaultSignalHandlerImpls.map();

  fire<S extends Signal, C extends SignalConstructor<S>>(
    type: C,
    ...params: ConstructorParameters<C>
  ): S {
    return DefaultSignalHandlerImpls.fire(this, type, ...params);
  }

  on<S extends Signal>(
    type: SignalConstructor<SignalMatching<S, this & Behavior>>,
    listener: SignalListener<SignalMatching<S, this & Behavior>>,
    priority: number = 0,
  ): SignalSubscription<S> {
    const subscription = DefaultSignalHandlerImpls.on(this, type, listener, priority);
    return subscription as SignalSubscription<S>;
  }

  unregister<T extends Signal>(type: SignalConstructor<T>, listener: SignalListener<T>): void {
    DefaultSignalHandlerImpls.unregister(this, type, listener);
  }
  // #endregion

  constructor(ctx: BehaviorContext) {
    this.game = ctx.game;
    this.entity = ctx.entity;

    if (ctx.ref) this.ref = ctx.ref;
    if (ctx.values) this.#defaultValues = ctx.values;
  }

  destroy() {
    this.fire(BehaviorDestroyed, this);
    this.entity.fire(BehaviorDestroyed, this);
    let ancestor = this.entity.parent;
    while (ancestor) {
      ancestor.fire(BehaviorDescendantDestroyed, this);
      ancestor = ancestor.parent;
    }

    const idx = this.entity.behaviors.indexOf(this);
    if (idx !== -1) this.entity.behaviors.splice(idx);

    for (const value of this.#values.values()) value.destroy();
    this.externalListeners.forEach(s => s.unsubscribe());
  }

  [Symbol.dispose]() {
    this.destroy();
  }

  #needsSetup = true;
  #initialized = false;
  #gameListeners: { readonly unsubscribe: () => void }[] = [];

  #enable() {
    if (!this.#needsSetup) return;
    this.#needsSetup = false;

    if (!this.#initialized) {
      this.onInitialize();
      this.#initialized = true;
    }

    const listenInternal: typeof this.listen = (o, s, f) => {
      const sub = this.listen(o, s, f);
      this.#gameListeners.push(sub);
      return sub;
    };
    if (this.onPreTick) listenInternal(this.entity.game, GamePreTick, this.onPreTick);
    if (this.onFrame) listenInternal(this.entity.game, GameRender, this.onFrame);
    if (this.onPostTick) listenInternal(this.entity.game, GamePostTick, this.onPostTick);
  }

  #disable() {
    this.#needsSetup = true;
    this.#gameListeners.forEach(sub => sub.unsubscribe());
    this.#gameListeners.length = 0;
  }

  /**
   * Returns true if the current client has authority over the entity this behavior is attached to.
   */
  hasAuthority() {
    return (
      this.game.network.self === this.entity.authority || this.entity.authority === undefined
    );
  }

  #spawned = false;

  [internal.behaviorSpawn](): void {
    if (this.#spawned) return;
    this.#spawned = true;

    if (this.entity.enabled) {
      this.#enable();
    }

    this.entity.on(EntityEnableChanged, ({ enabled }) => {
      if (enabled) this.#enable();
      else this.#disable();
    });

    this.fire(BehaviorSpawned, this);
    this.entity.fire(BehaviorSpawned, this);
    let ancestor = this.entity.parent;
    while (ancestor) {
      ancestor.fire(BehaviorDescendantSpawned, this);
      ancestor = ancestor.parent;
    }
  }

  [internal.implicitSetup]() {
    // @ts-expect-error ... = "I know this is correct"
    const valuesToDefine = this.constructor[internal.defineValuesProperties];

    if (valuesToDefine && valuesToDefine.length > 0) {
      for (const td of valuesToDefine) {
        if (td.adapterType) {
          // @ts-expect-error ...
          this.defineValue(this.constructor, td.propertyKey, { type: td.adapterType });
        } else {
          // @ts-expect-error ...
          this.defineValue(this.constructor, td.propertyKey);
        }
      }
    }
  }

  setup(): void {}
  onInitialize(): void {}
  onPreTick?(): void;
  onTick?(): void;
  onPostTick?(): void;
  onFrame?(): void;
}
