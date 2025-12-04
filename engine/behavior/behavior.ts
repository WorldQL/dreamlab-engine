import { createId } from "@dreamlab/vendor/nanoid.ts";
import type { ConditionalExcept } from "@dreamlab/vendor/type-fest.ts";

import type {
  AdapterTypeTag,
  AnySyncedObject,
  Entity,
  Game,
  Inputs,
  ISignalHandler,
  JsonValue,
  Primitive,
  Signal,
  SignalConstructor,
  SignalListener,
  SignalListenerOptions,
  SignalMatching,
  SignalSubscription,
  SyncedObjectInfo,
  Time,
  ValueTypeTag,
} from "@dreamlab/engine";
import {
  BehaviorDescendantDestroyed,
  BehaviorDescendantSpawned,
  BehaviorDestroyed,
  BehaviorSpawned,
  Collider,
  DefaultSignalHandlerImpls,
  EntityCollision,
  EntityEnableChanged,
  GamePostTick,
  GamePreTick,
  GameRender,
  inferValueTypeTag,
  Value,
  ValueTypeAdapter,
} from "@dreamlab/engine";
import * as internal from "@dreamlab/engine/internal";
import { setupSyncedObjects } from "../synced-objects/decorator.ts";
import { setupSyncedValues } from "../value/decorator.ts";

// deno-lint-ignore no-unused-vars
import type { Clickable } from "@dreamlab/engine"; // this is used in jsdoc
import { InferSyncedObjectType } from "../synced-objects/inference.ts";

export interface BehaviorContext {
  game: Game;
  entity: Entity;
  ref?: string;
  values?: Record<string, Primitive>;
  sync?: Record<string, SyncedObjectInfo>;
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
  sync?: Record<Exclude<keyof B, keyof Behavior> | (string & Record<never, never>), SyncedObjectInfo>;
  _ref?: string;
}

type BehaviorValueProp<B extends Behavior> = Exclude<
  // deno-lint-ignore ban-types
  keyof ConditionalExcept<B, Function>,
  keyof Behavior
>;
export type BehaviorValueOpts<T> = {
  type?: ValueTypeTag<T>;
  description?: string;
  replicated?: boolean;
  hidden?: Value["hidden"];
  persistent?: boolean;
};

export class Behavior implements ISignalHandler {
  readonly game: Game;
  readonly entity: Entity;

  protected get time(): Time {
    return this.game.time;
  }
  protected get inputs(): Inputs {
    return this.game.inputs;
  }

  readonly [internal.syncedObjectContainerObjectsField] = new Map<string, AnySyncedObject>();
  get [internal.syncedObjectContainerReadyField]() {
    return this.entity[internal.syncedObjectContainerReadyField];
  }

  static createRef(): string {
    return createId("bhv", { length: 10 });
  }

  readonly ref: string = Behavior.createRef();

  // #region Values
  #syncOverrides: Record<string, SyncedObjectInfo> = {};

  getSyncedObject<
    P extends string &
      keyof {
        [K in keyof B as K extends keyof Behavior ? never : K]: B[K];
      },
    B extends Behavior = this,
    T extends AnySyncedObject = InferSyncedObjectType<B[P]>,
  >(name: P, _type?: T): T {
    const object = this[internal.syncedObjectContainerObjectsField].get(name);
    if (!object)
      throw new Error(`SyncedObject '${name}' was not found on ${this.constructor.name}!`);
    return object as T;
  }

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

  defineValue<B extends Behavior, const P extends string & BehaviorValueProp<B>>(
    bType: BehaviorConstructor<B>, // can't just be `this` because TypeScript :(
    prop: P,
    opts: BehaviorValueOpts<B[P]> = {},
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
      adapter[internal.valueRelatedEntity] = this.entity;
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
      adapter ? adapter.convertToPrimitive(originalValue as T) : (originalValue as JsonValue),
      opts.type ?? (inferValueTypeTag(defaultValue) as ValueTypeTag<B[typeof prop]>),
      opts.description ?? prop, // TODO: autogenerate description (fix casing & spacing)
      adapter,
    );

    if (opts.replicated !== undefined) value.replicated = opts.replicated;
    if (opts.hidden !== undefined) value.hidden = opts.hidden;
    if (opts.persistent !== undefined) value.persistent = opts.persistent;

    value[internal.valueRelatedEntity] = this.entity;
    if (adapter) adapter.valueObj = value;

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
  // deno-lint-ignore no-explicit-any
  readonly externalListeners: SignalSubscription<any>[] = [];

  protected listen<S extends Signal, T extends ISignalHandler>(
    receiver: T,
    signalType: SignalConstructor<SignalMatching<S, T>>,
    signalListener: SignalListener<SignalMatching<S, T>>,
    options?: SignalListenerOptions,
  ): SignalSubscription<S> {
    const listenerOwnedByThis = Object.values(
      Object.getOwnPropertyDescriptors(this.constructor.prototype),
    )
      .map(t => t.value)
      .includes(signalListener);
    const boundSignalListener = listenerOwnedByThis
      ? signalListener.bind(this)
      : signalListener;

    const subscription = receiver.on(signalType, boundSignalListener, options);
    this.externalListeners.push(subscription);
    return subscription;
  }
  // #endregion

  // #region Signals
  readonly signalSubscriptionMap = DefaultSignalHandlerImpls.map();

  fire<C extends SignalConstructor>(
    type: C,
    ...params: ConstructorParameters<C>
  ): C extends SignalConstructor<infer S> ? S : object {
    return DefaultSignalHandlerImpls.fire(this, type, ...params);
  }

  on<S extends Signal>(
    type: SignalConstructor<SignalMatching<S, this & Behavior>>,
    listener: SignalListener<SignalMatching<S, this & Behavior>>,
    options?: SignalListenerOptions,
  ): SignalSubscription<S> {
    const subscription = DefaultSignalHandlerImpls.on(this, type, listener, options);
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
    if (ctx.sync) this.#syncOverrides = ctx.sync;

    this.game.sync.register(this);
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
    this.#gameListeners.forEach(s => s.unsubscribe());
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
      if (this.game.isClient()) {
        this.onInitializeClient?.();
      }
      if (this.game.isServer()) {
        this.onInitializeServer?.();
      }
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
  hasAuthority(assumeServer = false): boolean {
    let authority = this.entity.authority;
    if (assumeServer) authority ??= "server";
    return this.game.network.self === authority;
  }

  /**
   * Registers a collision listener
   */
  registerCollisions(handler: (e: EntityCollision) => void): void {
    if (this.entity instanceof Collider) {
      this.listen(this.entity, EntityCollision, handler);
    } else {
      console.warn("Tried to registerCollisions() for non-collider entity!");
    }
  }

  #spawned = false;

  [internal.behaviorHotReloading]: boolean = false;
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
    setupSyncedValues(this);
    setupSyncedObjects(this.game.sync, this, this.#syncOverrides); // TODO: overrides from scene def
  }

  setup(): void {}
  onInitialize(): void {}
  onPreTick?(): void;
  onTick?(): void;
  onPostTick?(): void;
  onFrame?(): void;

  /**
   * Runs every time this Behavior ticks on the client.
   */
  onTickClient?(): void;
  /**
   * Runs every time this Behavior ticks on the server.
   */
  onTickServer?(): void;

  /**
   * Runs when this Behavior initializes on the client.
   */
  onInitializeClient?(): void;
  /**
   * Runs when this Behavior initializes on the server.
   */
  onInitializeServer?(): void;

  /**
   * Called when the uses mouses down (clicks) over the entity this Behavior is attached to.
   * Works ONLY IF the entity is a {@link Clickable}
   */
  onMouseDown?(button: "left" | "right" | "middle"): void;

  /**
   * Called when the uses mouses releases their mouse after clicking the entity this Behavior is attached to.
   * Works ONLY IF the entity is a {@link Clickable}
   */
  onMouseUp?(button: "left" | "right" | "middle"): void;
}
