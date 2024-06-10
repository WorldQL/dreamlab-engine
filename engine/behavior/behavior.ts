import { ulid } from "@dreamlab/vendor/std-ulid.ts";
import { Entity } from "../entity/mod.ts";
import { Game } from "../game.ts";
import { Primitive, SyncedValue } from "../value.ts";
import { BehaviorValues } from "./behavior-values.ts";
import {
  ISignalHandler,
  Signal,
  SignalMatching,
  SignalConstructor,
  SignalListener,
} from "../signal.ts";
import { EntityUpdate } from "../signals/entity-updates.ts";
import { GameRender } from "../signals/game-events.ts";

export interface BehaviorContext<E extends Entity = Entity> {
  game: Game;
  entity: E;
  ref?: string;
  values?: Record<string, Primitive>;
}

export type BehaviorConstructor<
  E extends Entity = Entity,
  B extends Behavior<E> = Behavior<E>
> = (new (ctx: BehaviorContext<E>) => B) & {
  onLoaded?(game: Game): void;
};

export type BehaviorSyncedValueProps<
  E extends Entity = Entity,
  B extends Behavior<E> = Behavior<E>
> = {
  [K in keyof B as B[K] extends SyncedValue<infer _>
    ? K
    : never]: B[K] extends SyncedValue<infer V> ? V : never;
};

export interface BehaviorDefinition<E extends Entity, B extends Behavior<E>> {
  type: BehaviorConstructor<E, B>;
  values?: BehaviorSyncedValueProps<E, B>;
  _ref?: string;
}

export class Behavior<E extends Entity = Entity> {
  readonly game: Game;
  readonly entity: E;

  readonly ref: string = ulid();

  readonly values: BehaviorValues<E, this>;

  readonly listeners: [
    receiver: WeakRef<ISignalHandler>,
    type: SignalConstructor,
    listener: SignalListener
  ][] = [];

  constructor(ctx: BehaviorContext<E>) {
    this.game = ctx.game;
    this.entity = ctx.entity;

    if (ctx.ref) this.ref = ctx.ref;

    this.values = new BehaviorValues(this, ctx.values ?? {});
  }

  listen<S extends Signal, T extends ISignalHandler>(
    receiver: T,
    signalType: SignalConstructor<SignalMatching<S, T>>,
    signalListener: SignalListener<SignalMatching<S, T>>
  ) {
    receiver.on(signalType, signalListener);
    this.listeners.push([
      new WeakRef(receiver as ISignalHandler),
      signalType as SignalConstructor,
      signalListener as SignalListener,
    ]);
  }

  destroy() {
    this.values.destroy();
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
      this.listen(this.entity.game, GameRender, (e) => onFrame(e.delta));
    }

    this.onInitialize();
  }

  onInitialize(): void {}
  onTick?(): void;
  onFrame?(delta: number): void;
}
