import RAPIER from "@dreamlab/vendor/rapier.ts";
import { BehaviorLoader } from "./behavior/behavior-loader.ts";
import { EntityStore, LocalRoot, PrefabsRoot, ServerRoot, WorldRoot } from "./entity/mod.ts";
import { Inputs } from "./input/mod.ts";
import * as internal from "./internal.ts";
import { ClientNetworking, ServerNetworking } from "./network.ts";
import { PhysicsEngine } from "./physics.ts";
import { GameRenderer } from "./renderer/mod.ts";
import {
  ISignalHandler,
  Signal,
  SignalConstructor,
  SignalConstructorMatching,
  SignalListener,
} from "./signal.ts";
import {
  GamePostRender,
  GamePreRender,
  GameRender,
  GameShutdown,
  GameTick,
} from "./signals/game-events.ts";
import { GameStatusChange } from "./signals/mod.ts";
import { Time } from "./time.ts";
import { UIManager } from "./ui.ts";
import { SyncedValueRegistry } from "./value/mod.ts";

export interface GameOptions {
  instanceId: string;
  worldId: string;
}

export interface ClientGameOptions extends GameOptions {
  network: ClientNetworking;
  container: HTMLDivElement;
}
export interface ServerGameOptions extends GameOptions {
  network: ServerNetworking;
}

export enum GameStatus {
  Loading,
  Running,
  Shutdown,
}

export abstract class BaseGame implements ISignalHandler {
  public abstract isClient(): this is ClientGame;
  public abstract isServer(): this is ServerGame;

  readonly instanceId: string;
  readonly worldId: string;

  paused: boolean = false;

  constructor(opts: GameOptions) {
    if (!(this instanceof ServerGame || this instanceof ClientGame))
      throw new Error("BaseGame is sealed to ServerGame and ClientGame!");

    this.instanceId = opts.instanceId;
    this.worldId = opts.worldId;

    // now that we know we are ServerGame | ClientGame, we can safely cast to Game
  }

  readonly syncedValues = new SyncedValueRegistry(this as unknown as Game);

  readonly entities = new EntityStore();

  readonly world = new WorldRoot(this as unknown as Game);
  readonly prefabs = new PrefabsRoot(this as unknown as Game);

  readonly time = new Time(this as unknown as Game);
  readonly inputs = new Inputs(this as unknown as Game);

  [internal.behaviorScriptLoader] = new BehaviorLoader(this as unknown as Game);

  #initialized: boolean = false;

  #physics: PhysicsEngine | undefined;
  get physics(): PhysicsEngine {
    if (this.#physics) return this.#physics;
    throw new Error("physics are not yet initialized!");
  }

  #status: GameStatus = GameStatus.Loading;
  #statusDescription: string | undefined;

  get status(): GameStatus {
    return this.#status;
  }
  get statusDescription(): string | undefined {
    return this.#statusDescription;
  }

  setStatus(status: GameStatus, description?: string) {
    this.#status = status;
    this.#statusDescription = description;
    this.fire(GameStatusChange);
  }

  /** Resolves res: / cloud: URIs to https:// URLs */
  resolveResource(uri: string) {
    // TODO: not yet properly implemented
    return uri;
  }

  // #region Lifecycle
  async initialize() {
    if (this.#initialized) return;
    this.#initialized = true;

    await RAPIER.init();

    this.#physics = new PhysicsEngine(this as unknown as Game);
  }

  tick() {
    if (!this.#initialized)
      throw new Error("Illegal state: Game was not initialized before tick loop began!");

    this.time[internal.timeSetMode]("tick");
    this.time[internal.timeTick]();

    // run the pre tick phase, then a physics update, then the tick phase
    // so e.g. in Rigidbody2D we can move the body to the entity's transform,
    // have the physics world update, and then move the transform to the new position of the body.

    this[internal.preTickEntities]();
    if (!this.paused) this.physics.tick();
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
    this.setStatus(GameStatus.Shutdown);
    this.fire(GameShutdown);
    this.physics.shutdown();
  }

  [Symbol.dispose]() {
    this.shutdown();
  }
  // #endregion

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

  readonly remote: ServerRoot = new ServerRoot(this);
  readonly local: undefined;

  drawFrame: undefined;

  readonly network: ServerNetworking;

  constructor(opts: ServerGameOptions) {
    super(opts);
    this.network = opts.network;
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

  readonly ui: UIManager = new UIManager(this);

  readonly network: ClientNetworking;

  constructor(opts: ClientGameOptions) {
    super(opts);

    this.container = opts.container;
    this.renderer = new GameRenderer(this);

    this.network = opts.network;
    this.syncedValues[internal.setSyncedValueRegistrySource](this.network.connectionId);
  }

  async initialize() {
    await super.initialize();
    await this.renderer.initialize();
    this.inputs[internal.inputsRegisterHandlers]();
    this.ui[internal.uiInit]();
  }

  override shutdown() {
    this.ui[internal.uiDestroy]();
    super.shutdown();
  }

  readonly local: LocalRoot = new LocalRoot(this);
  readonly remote: undefined;

  #tickAccumulator = 0;
  tickClient(delta: number): void {
    this.#tickAccumulator += delta;

    while (this.#tickAccumulator >= this.physics.tickDelta) {
      if (this.#tickAccumulator > 5_000) {
        this.#tickAccumulator = 0;
        console.warn("Skipped a bunch of ticks (tick accumulator ran over 5 seconds!)");
        break;
      }

      this.#tickAccumulator -= this.physics.tickDelta;
      this.tick();
    }

    this.time[internal.timeSetMode]("render");
    this.time[internal.timeIncrement](delta, this.#tickAccumulator / this.physics.tickDelta);

    this.fire(GamePreRender);
    this.fire(GameRender);
    this.renderer.renderFrame();
    this.fire(GamePostRender);
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
