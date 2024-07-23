import { generateCUID } from "@dreamlab/vendor/cuid.ts";
import type { ConditionalExcept } from "@dreamlab/vendor/type-fest.ts";

import { Entity } from "../entity/mod.ts";
import { Game } from "../game.ts";
import { Primitive, Value, ValueTypeTag, inferValueTypeTag } from "../value/mod.ts";
import {
  ISignalHandler,
  Signal,
  SignalMatching,
  SignalConstructor,
  SignalListener,
  SignalConstructorMatching,
} from "../signal.ts";
import { EntityUpdate } from "../signals/entity-updates.ts";
import { GameRender } from "../signals/game-events.ts";
import { BehaviorDestroyed } from "../signals/behavior-lifecycle.ts";

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

  protected defineValues<B extends Behavior, Props extends BehaviorValueProp<B>[]>(
    eType: BehaviorConstructor<B>,
    ...props: {
      [I in keyof Props]: Props[I] extends BehaviorValueProp<B> ? Props[I] : never;
    }
  ) {
    for (const prop of props) {
      this.value(eType, prop);
    }
  }

  protected value<B extends Behavior>(
    bType: BehaviorConstructor<B>, // can't just be `this` because TypeScript :(
    prop: BehaviorValueProp<B>,
    opts: BehaviorValueOpts<B, typeof prop> = {},
  ): Value<B[typeof prop]> {
    if (!(this instanceof bType))
      throw new TypeError(`${this.constructor} is not an instance of ${bType}`);

    const identifier = `${this.entity.ref}/${this.ref}/${prop}`;
    if (this.#values.has(identifier))
      throw new Error(`A value with the identifier '${identifier}' already exists!`);

    type T = Value<B[typeof prop]>["value"];
    let defaultValue: T = this[prop] as T;
    if (this.#defaultValues[prop]) defaultValue = this.#defaultValues[prop] as T;

    const value = new Value(
      this.game.values,
      identifier,
      defaultValue,
      opts.type ?? (inferValueTypeTag(defaultValue) as ValueTypeTag<B[typeof prop]>),
      opts.description ?? prop,
    );
    if (opts.replicated) value.replicated = opts.replicated;

    Object.defineProperty(this, prop, {
      configurable: true,
      enumerable: true,
      set: v => {
        value.value = v;
      },
      get: () => value.value,
    });

    this.#values.set(prop, value as Value<unknown>);

    return value;
  }
  // #endregion

  // #region External Listeners
  readonly listeners: [
    receiver: WeakRef<ISignalHandler>,
    type: SignalConstructor,
    listener: SignalListener,
  ][] = [];

  protected listen<S extends Signal, T extends ISignalHandler>(
    receiver: T,
    signalType: SignalConstructor<SignalMatching<S, T>>,
    signalListener: SignalListener<SignalMatching<S, T>>,
  ) {
    const boundSignalListener = signalListener.bind(this);

    receiver.on(signalType, boundSignalListener);
    this.listeners.push([
      new WeakRef(receiver as ISignalHandler),
      signalType as SignalConstructor,
      boundSignalListener as SignalListener,
    ]);
  }
  // #endregion

  // #region Signals
  #signalListenerMap = new Map<SignalConstructor, SignalListener[]>();

  fire<
    S extends Signal,
    C extends SignalConstructorMatching<S, this & Behavior>,
    A extends ConstructorParameters<C>,
  >(ctor: C, ...args: A) {
    const listeners = this.#signalListenerMap.get(ctor);
    if (!listeners) return;

    const signal = new ctor(...args);
    listeners.forEach(l => l(signal));
  }

  on<S extends Signal>(
    type: SignalConstructorMatching<S, this & Behavior>,
    listener: SignalListener<S>,
  ) {
    const listeners = this.#signalListenerMap.get(type) ?? [];
    listeners.push(listener as SignalListener);
    this.#signalListenerMap.set(type, listeners);
  }

  unregister<T extends Signal>(type: SignalConstructor<T>, listener: SignalListener<T>) {
    const listeners = this.#signalListenerMap.get(type);
    if (!listeners) return;
    const idx = listeners.indexOf(listener as SignalListener);
    if (idx !== -1) listeners.splice(idx, 1);
  }
  // #endregion

  // #region Registry
  static #behaviorTypeRegistry = new Map<BehaviorConstructor<unknown & Behavior>, string>();
  static registerType<T extends Behavior>(type: BehaviorConstructor<T>, namespace: string) {
    this.#behaviorTypeRegistry.set(type, namespace);
  }
  static #ensureBehaviorTypeIsRegistered = (newTarget: unknown) => {
    const target = newTarget as BehaviorConstructor;

    if (!Behavior.#behaviorTypeRegistry.has(target)) {
      throw new Error(`Behavior type registry is missing ${target.name}!`);
    }
  };
  static getTypeName(type: BehaviorConstructor): string {
    const namespace = this.#behaviorTypeRegistry.get(type);
    if (!namespace) throw new Error(`Behavior type registry is missing ${type.name}!`);
    return `${namespace}/${type.name}`;
  }
  static getBehaviorType(typeName: string): BehaviorConstructor {
    for (const [type, namespace] of this.#behaviorTypeRegistry.entries())
      if (typeName === `${namespace}/${type.name}`) return type;

    throw new Error(`Behavior type ${typeName} is not registered!`);
  }
  // #endregion

  constructor(ctx: BehaviorContext) {
    Behavior.#ensureBehaviorTypeIsRegistered(new.target);

    this.game = ctx.game;
    this.entity = ctx.entity;

    if (ctx.ref) this.ref = ctx.ref;
    if (ctx.values) this.#defaultValues = ctx.values;
  }

  destroy() {
    this.fire(BehaviorDestroyed);

    const idx = this.entity.behaviors.indexOf(this);
    if (idx !== -1) this.entity.behaviors.splice(idx);

    for (const value of this.#values.values()) value.destroy();
    for (const [receiverRef, type, listener] of this.listeners) {
      const receiver = receiverRef.deref();
      if (!receiver) continue;
      receiver.unregister(type, listener);
    }
  }

  [Symbol.dispose]() {
    this.destroy();
  }

  spawn(): void {
    if (this.onTick) {
      // idk why i have to cast to Entity. i think it's a typescript bug
      const onTick = this.onTick.bind(this);
      this.listen(this.entity as Entity, EntityUpdate, () => {
        if (!this.game.paused) onTick();
      });
    }

    if (this.onFrame) {
      const onFrame = this.onFrame.bind(this);
      this.listen(this.entity.game, GameRender, () => onFrame());
    }

    this.onInitialize();
  }

  onInitialize(): void {}
  onTick?(): void;
  onFrame?(): void;
}
