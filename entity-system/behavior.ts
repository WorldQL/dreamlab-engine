import { ulid } from "@std/ulid";
import { Entity } from "./entity.ts";
import { Game } from "./game.ts";
import { SyncedValue } from "./synced-value.ts";
import { BehaviorValues } from "./behavior-values.ts";
import {
  ISignalHandler,
  Signal,
  SignalMatching,
  SignalConstructor,
  SignalListener,
} from "./signals.ts";
import { EntityUpdate } from "./signals/entity-updates.ts";
import { GameRender } from "./signals/game-events.ts";

export interface BehaviorContext<E extends Entity = Entity> {
  game: Game;
  entity: E;
  uid?: string;
}

export type BehaviorConstructor<
  E extends Entity = Entity,
  B extends Behavior<E> = Behavior<E>
> = (new (ctx: BehaviorContext<E>) => B) & {
  registerInputs?(): void;
};

export type BehaviorSyncedValueProps<
  E extends Entity = Entity,
  B extends Behavior<E> = Behavior<E>
> = {
  [K in keyof B as B[K] extends SyncedValue<infer _>
    ? K
    : never]: B[K] extends SyncedValue<infer V> ? V : never;
};

interface BehaviorDefinitionWithType<E extends Entity, B extends Behavior<E>> {
  type: BehaviorConstructor<E, B>;
  script: undefined;
  values?: BehaviorSyncedValueProps<E, B>;
  _uid?: string;
}

interface BehaviorDefinitionWithScript<
  E extends Entity,
  B extends Behavior<E>
> {
  type: undefined;
  script: string;
  values?: BehaviorSyncedValueProps<E, B>;
  _uid?: string;
}

export type BehaviorDefinition<
  E extends Entity = Entity,
  B extends Behavior<E> = Behavior<E>
> = BehaviorDefinitionWithType<E, B> | BehaviorDefinitionWithScript<E, B>;

export class Behavior<E extends Entity = Entity> {
  readonly game: Game;
  readonly entity: E;

  readonly uid: string = ulid();

  readonly values = new BehaviorValues<E, this>(this);

  readonly listeners: [
    receiver: WeakRef<ISignalHandler>,
    type: SignalConstructor,
    listener: SignalListener
  ][] = [];

  constructor(ctx: BehaviorContext<E>) {
    this.game = ctx.game;
    this.entity = ctx.entity;

    if (ctx.uid) this.uid = ctx.uid;
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
