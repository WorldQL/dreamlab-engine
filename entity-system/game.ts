import RAPIER from "./_deps/rapier.ts";
import {
  LocalRoot,
  PrefabsRoot,
  RemoteRoot,
  WorldRoot,
} from "./entity-roots.ts";
import { EntityStore } from "./entity-store.ts";
import * as internal from "./internal.ts";
import { PhysicsEngine } from "./physics.ts";
import {
  ISignalHandler,
  Signal,
  SignalConstructor,
  SignalListener,
} from "./signals.ts";
import { GameRender, GameShutdown, GameTick } from "./signals/game-events.ts";
import { SyncedValueRegistry } from "./synced-value.ts";

abstract class BaseGame implements ISignalHandler {
  constructor() {
    if (!(this instanceof ServerGame || this instanceof ClientGame))
      throw new Error("BaseGame is sealed to ServerGame and ClientGame!");

    // now that we know we are ServerGame | ClientGame, we can safely cast to Game
  }

  entities: EntityStore = new EntityStore(this as unknown as Game);

  world: WorldRoot = new WorldRoot(this as unknown as Game);
  prefabs: PrefabsRoot = new PrefabsRoot(this as unknown as Game);

  #initialized: boolean = false;

  #physics: PhysicsEngine | undefined;
  get physics(): PhysicsEngine {
    if (this.#physics) return this.#physics;
    throw new Error("physics are not yet initialized!");
  }

  async initialize() {
    if (this.#initialized) return;
    this.#initialized = true;

    await RAPIER.init();

    this.#physics = new PhysicsEngine(this as unknown as Game);
  }

  tick() {
    if (!this.#initialized)
      throw new Error(
        "Illegal state: Game was not initialized before tick loop began!"
      );

    // run the pre tick phase, then a physics update, then the tick phase
    // so e.g. in Rigidbody2D we can move the body to the entity's transform,
    // have the physics world update, and then move the transform to the new position of the body.

    this[internal.preTickEntities]();
    this.physics.tick();
    this[internal.tickEntities]();

    this.fire(GameTick);
  }

  [internal.preTickEntities]() {
    this.world[internal.preTickEntities]();
  }

  [internal.tickEntities]() {
    this.world[internal.tickEntities]();
  }

  shutdown() {
    this.fire(GameShutdown);
    this.physics.shutdown();
  }

  [Symbol.dispose]() {
    this.shutdown();
  }

  // #region SignalHandler impl
  #signalListenerMap = new Map<SignalConstructor, SignalListener[]>();

  fire<
    T extends Signal,
    C extends SignalConstructor<T>,
    A extends ConstructorParameters<C>
  >(ctor: C, ...args: A) {
    const signal = new ctor(...args);
    for (const [type, listeners] of this.#signalListenerMap.entries()) {
      if (!(signal instanceof type)) continue;
      listeners.forEach((l) => l(signal));
    }
  }

  on<T extends Signal>(
    type: SignalConstructor<T>,
    listener: SignalListener<T>
  ) {
    const listeners = this.#signalListenerMap.get(type) ?? [];
    listeners.push(listener as SignalListener);
    this.#signalListenerMap.set(type, listeners);
  }

  unregister<T extends Signal>(
    type: SignalConstructor<T>,
    listener: SignalListener<T>
  ) {
    const listeners = this.#signalListenerMap.get(type);
    if (!listeners) return;
    const idx = listeners.indexOf(listener as SignalListener);
    if (idx !== -1) listeners.splice(idx, 1);
  }
  // #endregion
}

export class ServerGame extends BaseGame {
  remote: RemoteRoot = new RemoteRoot(this);
  local: undefined;

  syncedValues: SyncedValueRegistry = new SyncedValueRegistry(undefined);

  drawFrame: undefined;

  [internal.preTickEntities]() {
    super[internal.preTickEntities]();
    this.remote[internal.preTickEntities]();
  }

  [internal.tickEntities]() {
    super[internal.tickEntities]();
    this.remote[internal.tickEntities]();
  }
}

export class ClientGame extends BaseGame {
  // TODO: replace connectionId with actual networking stack
  constructor(connectionId: string) {
    super();
    this.syncedValues = new SyncedValueRegistry(connectionId);
  }

  local: LocalRoot = new LocalRoot(this);
  remote: undefined;
  syncedValues: SyncedValueRegistry;

  drawFrame(delta: number) {
    this.fire(GameRender, delta);
  }

  [internal.preTickEntities]() {
    super[internal.preTickEntities]();
    this.local[internal.preTickEntities]();
  }

  [internal.tickEntities]() {
    super[internal.tickEntities]();
    this.local[internal.tickEntities]();
  }
}

export type Game = ServerGame | ClientGame;
