import { generateCUID } from "@dreamlab/vendor/cuid.ts";
import type { ConditionalExcept } from "@dreamlab/vendor/type-fest.ts";

import { Entity } from "../entity/mod.ts";
import { Game } from "../game.ts";
import { Primitive, SyncedValue, ValueTypeTag, inferValueTypeTag } from "../value/mod.ts";
import {
  ISignalHandler,
  Signal,
  SignalMatching,
  SignalConstructor,
  SignalListener,
} from "../signal.ts";
import { EntityUpdate } from "../signals/entity-updates.ts";
import { GameRender } from "../signals/game-events.ts";

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

export class Behavior {
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
  #values = new Map<string, SyncedValue>();
  get values(): ReadonlyMap<string, SyncedValue> {
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
  ): SyncedValue<B[typeof prop]> {
    if (!(this instanceof bType))
      throw new TypeError(`${this.constructor} is not an instance of ${bType}`);

    const identifier = `${this.entity.ref}/${this.ref}/${prop}`;
    if (this.#values.has(identifier))
      throw new Error(`A value with the identifier '${identifier}' already exists!`);

    type T = SyncedValue<B[typeof prop]>["value"];
    let defaultValue: T = this[prop] as T;
    if (this.#defaultValues[prop]) defaultValue = this.#defaultValues[prop] as T;

    const syncedValue = new SyncedValue(
      this.game.syncedValues,
      identifier,
      defaultValue,
      opts.type ?? (inferValueTypeTag(defaultValue) as ValueTypeTag<B[typeof prop]>),
      opts.description ?? prop,
    );
    if (opts.replicated) syncedValue.replicated = opts.replicated;

    Object.defineProperty(this, prop, {
      configurable: true,
      enumerable: true,
      set: v => {
        syncedValue.value = v;
      },
      get: () => syncedValue.value,
    });

    this.#values.set(prop, syncedValue as SyncedValue<unknown>);

    return syncedValue;
  }
  // #endregion

  readonly listeners: [
    receiver: WeakRef<ISignalHandler>,
    type: SignalConstructor,
    listener: SignalListener,
  ][] = [];

  constructor(ctx: BehaviorContext) {
    this.game = ctx.game;
    this.entity = ctx.entity;

    if (ctx.ref) this.ref = ctx.ref;
    if (ctx.values) this.#defaultValues = ctx.values;
  }

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

  destroy() {
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
      this.listen(this.entity as Entity, EntityUpdate, () => onTick());
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
