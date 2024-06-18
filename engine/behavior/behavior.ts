import { generateCUID } from "@dreamlab/vendor/cuid.ts";
import { Entity } from "../entity/mod.ts";
import { Game } from "../game.ts";
import { Primitive, SyncedValue } from "../value/mod.ts";
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
export type BehaviorSyncedValueProps<
  B extends Behavior = Behavior,
> = {
  [K in keyof B as B[K] extends SyncedValue<infer _> ? K : never]:
    B[K] extends SyncedValue<infer V> ? V : never;
};

export interface BehaviorDefinition<B extends Behavior = Behavior> {
  type: BehaviorConstructor<B>;
  values?: Partial<BehaviorSyncedValueProps<B>>;
  _ref?: string;
}

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

  readonly values: BehaviorValues<this>;

  readonly listeners: [
    receiver: WeakRef<ISignalHandler>,
    type: SignalConstructor,
    listener: SignalListener,
  ][] = [];

  constructor(ctx: BehaviorContext) {
    this.game = ctx.game;
    this.entity = ctx.entity;

    if (ctx.ref) this.ref = ctx.ref;

    this.values = new BehaviorValues(this, ctx.values ?? {});
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
      this.listen(this.entity.game, GameRender, () => onFrame());
    }

    this.onInitialize();
  }

  onInitialize(): void {}
  onTick?(): void;
  onFrame?(): void;
}
