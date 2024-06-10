import RAPIER from "@dreamlab/vendor/rapier.ts";
import { LocalRoot, PrefabsRoot, RemoteRoot, WorldRoot, EntityStore } from "./entity/mod.ts";
import * as internal from "./internal.ts";
import { PhysicsEngine } from "./physics.ts";
import {
  ISignalHandler,
  Signal,
  SignalConstructor,
  SignalConstructorMatching,
  SignalListener,
} from "./signal.ts";
import { GamePreRender, GameRender, GameShutdown, GameTick } from "./signals/game-events.ts";
import { SyncedValueRegistry } from "./value.ts";
import { BehaviorLoader } from "./behavior/behavior-loader.ts";
import { GameRenderer } from "./renderer/mod.ts";

export interface GameOptions {
  instanceId: string;
  worldId: string;
}

export interface ClientGameOptions extends GameOptions {
  // TODO: replace connectionId with actual networking stack
  connectionId: string;
  container: HTMLDivElement;
}
export interface ServerGameOptions extends GameOptions {}

export abstract class BaseGame implements ISignalHandler {
  public abstract isClient(): this is ClientGame;
  public abstract isServer(): this is ServerGame;

  readonly instanceId: string;
  readonly worldId: string;

  constructor(opts: GameOptions) {
    if (!(this instanceof ServerGame || this instanceof ClientGame))
      throw new Error("BaseGame is sealed to ServerGame and ClientGame!");

    this.instanceId = opts.instanceId;
    this.worldId = opts.worldId;

    // now that we know we are ServerGame | ClientGame, we can safely cast to Game
  }

  readonly syncedValues = new SyncedValueRegistry();

  readonly entities = new EntityStore(this as unknown as Game);

  readonly world = new WorldRoot(this as unknown as Game);
  readonly prefabs = new PrefabsRoot(this as unknown as Game);

  [internal.behaviorScriptLoader] = new BehaviorLoader(this as unknown as Game);

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
      throw new Error("Illegal state: Game was not initialized before tick loop began!");

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
    S extends Signal,
    C extends SignalConstructorMatching<S, BaseGame>,
    A extends ConstructorParameters<C>,
  >(ctor: C, ...args: A) {
    const listeners = this.#signalListenerMap.get(ctor);
    if (!listeners) return;

    const signal = new ctor(...args);
    listeners.forEach(l => l(signal));
  }

  on<S extends Signal>(
    type: SignalConstructorMatching<S, BaseGame>,
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
}

export class ServerGame extends BaseGame {
  public isClient = (): this is ClientGame => false;
  public isServer = (): this is ServerGame => true;

  readonly remote: RemoteRoot = new RemoteRoot(this);
  readonly local: undefined;

  drawFrame: undefined;

  constructor(opts: ServerGameOptions) {
    super(opts);
  }

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
  public isClient = (): this is ClientGame => true;
  public isServer = (): this is ServerGame => false;

  readonly container: HTMLDivElement;
  readonly renderer: GameRenderer;
  // readonly camera: Camera;

  constructor(opts: ClientGameOptions) {
    super(opts);

    this.container = opts.container;
    this.renderer = new GameRenderer(this);

    this.syncedValues[internal.setSyncedValueRegistryOriginator](opts.connectionId);
  }

  async initialize() {
    await super.initialize();
    await this.renderer.initialize();
  }

  readonly local: LocalRoot = new LocalRoot(this);
  readonly remote: undefined;

  drawFrame(time: number, delta: number) {
    this.fire(GamePreRender, delta);
    this.renderer.renderFrame(time, delta);
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
