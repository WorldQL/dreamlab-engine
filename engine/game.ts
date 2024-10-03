import { initRapier } from "@dreamlab/vendor/rapier.ts";

import { Value } from "@dreamlab/engine";
import { BehaviorLoader } from "./behavior/behavior-loader.ts";
import { BehaviorConstructor } from "./behavior/mod.ts";
import {
  Entity,
  EntityStore,
  LocalRoot,
  PrefabsRoot,
  ServerRoot,
  WorldRoot,
} from "./entity/mod.ts";
import { Inputs } from "./input/mod.ts";
import * as internal from "./internal.ts";
import { ClientNetworking, ServerNetworking } from "./network.ts";
import { PhysicsEngine } from "./physics.ts";
import { GameRenderer } from "./renderer/mod.ts";
import {
  DefaultSignalHandlerImpls,
  ISignalHandler,
  Signal,
  SignalConstructor,
  SignalListener,
  SignalMatching,
  SignalSubscription,
} from "./signal.ts";
import {
  GamePostRender,
  GamePostTick,
  GamePreTick,
  GameRender,
  GameShutdown,
  GameTick,
  InternalGameTick,
} from "./signals/game-events.ts";
import { GameStatusChange } from "./signals/mod.ts";
import { Time } from "./time.ts";
import { UIManager } from "./ui.ts";
import { ValueRegistry } from "./value/mod.ts";

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
  Loading = "loading",
  LoadingFinished = "loading_finished",
  Running = "running",
  Shutdown = "shutdown",
}

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

  readonly values = new ValueRegistry(this as unknown as Game);

  readonly entities = new EntityStore();

  readonly world = new WorldRoot(this as unknown as Game);
  readonly prefabs = new PrefabsRoot(this as unknown as Game);

  readonly time = new Time(this as unknown as Game);
  readonly inputs = new Inputs(this as unknown as Game);

  [internal.behaviorLoader] = new BehaviorLoader(this as unknown as Game);
  loadBehavior(scriptUri: string): Promise<BehaviorConstructor> {
    return this[internal.behaviorLoader].loadScript(scriptUri);
  }

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

  worldScriptBaseURL: string = "";
  cloudAssetBaseURL: string = "https://s3-assets.dreamlab.gg/";

  /** Resolves res:// and cloud:// URIs to https:// URLs */
  resolveResource(uri: string) {
    let url = new URL(uri);
    if (
      (["res:", "cloud:", "s3:"].includes(url.protocol) && url.host) ||
      url.pathname.startsWith("//")
    ) {
      url = new URL(url.href.replace(`${url.protocol}//`, `${url.protocol}`));
    }

    switch (url.protocol) {
      case "res:":
        return new URL(url.pathname, this.worldScriptBaseURL).toString();
      case "cloud:":
      case "s3:": // s3:// URIs are discouraged; kept for backwards-compat reasons.
        return new URL(url.pathname, this.cloudAssetBaseURL).toString();
      default:
        return uri;
    }
  }

  /** Fetches a resource (supports res:// and cloud:// URIs) */
  fetch(uri: string, init?: RequestInit): Promise<Response> {
    return fetch(this.resolveResource(uri), init);
  }

  // #region Lifecycle
  async initialize() {
    if (this.#initialized) return;
    this.#initialized = true;

    await initRapier();

    this.#physics = new PhysicsEngine(this as unknown as Game);
  }

  [internal.entityTickingOrderDirty]: boolean = true;
  [internal.entityTickingOrder]: Entity[] = [];

  [internal.submitEntityTickingOrder](entities: Entity[]) {
    this.world[internal.submitEntityTickingOrder](entities);
  }

  paused = new Value<boolean>(this.values, "paused", false, Boolean, "paused");

  tick() {
    if (this.status === GameStatus.Shutdown) return;
    if (!this.#initialized)
      throw new Error("Illegal state: Game was not initialized before tick loop began!");

    this.time[internal.timeSetMode]("tick");

    // don't tick at all when we're paused!
    if (this.paused.value) {
      this.fire(InternalGameTick);
      return;
    }
    this.time[internal.timeTick]();

    // run the pre tick phase, then a physics update, then the tick phase
    // so e.g. in Rigidbody2D we can move the body to the entity's transform,
    // have the physics world update, and then move the transform to the new position of the body.

    this.fire(GamePreTick);

    const entityTickingOrder = this[internal.entityTickingOrder];
    if (this[internal.entityTickingOrderDirty]) {
      entityTickingOrder.length = 0; // size list down to 0 but keep capacity (avoid expensive realloc on array grow!)
      this[internal.submitEntityTickingOrder](entityTickingOrder);
      this[internal.entityTickingOrderDirty] = false;
    }
    const entityCount = entityTickingOrder.length;

    for (let i = 0; i < entityCount; i++) {
      entityTickingOrder[i][internal.interpolationStartTick]();
    }
    this.physics.tick();
    for (let i = 0; i < entityCount; i++) {
      entityTickingOrder[i].onUpdate();
    }

    this.fire(GameTick);
    this.fire(GamePostTick);

    this.fire(InternalGameTick);
  }

  shutdown() {
    this.world.destroy();
    this.setStatus(GameStatus.Shutdown);
    this.fire(GameShutdown);
    this.physics.shutdown();
  }

  [Symbol.dispose]() {
    this.shutdown();
  }
  // #endregion

  // #region SignalHandler impl
  readonly signalSubscriptionMap = DefaultSignalHandlerImpls.map();

  fire<S extends Signal, C extends SignalConstructor<S>>(
    type: C,
    ...params: ConstructorParameters<C>
  ): S {
    return DefaultSignalHandlerImpls.fire(this, type, ...params);
  }

  on<S extends Signal>(
    type: SignalConstructor<SignalMatching<S, this & BaseGame>>,
    listener: SignalListener<SignalMatching<S, this & BaseGame>>,
    priority: number = 0,
  ): SignalSubscription<S> {
    const subscription = DefaultSignalHandlerImpls.on(this, type, listener, priority);
    return subscription as SignalSubscription<S>;
  }

  unregister<T extends Signal>(type: SignalConstructor<T>, listener: SignalListener<T>): void {
    DefaultSignalHandlerImpls.unregister(this, type, listener);
  }
  // #endregion
}

export class ServerGame extends BaseGame {
  public isClient = (): this is ClientGame => false;
  public isServer = (): this is ServerGame => true;

  readonly remote: ServerRoot = new ServerRoot(this);
  readonly local: undefined;

  readonly network: ServerNetworking;

  constructor(opts: ServerGameOptions) {
    super(opts);
    this.network = opts.network;
  }

  override shutdown(): void {
    this.remote.destroy();
    super.shutdown();
    this.network.disconnect();
  }

  [internal.submitEntityTickingOrder](entities: Entity[]) {
    super[internal.submitEntityTickingOrder](entities);
    this.remote[internal.submitEntityTickingOrder](entities);
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
    this.values[internal.setValueRegistrySource](this.network.self); // FIXME(Charlotte): remove (ValueRegistry has Game so we can just do game.network.self)
  }

  [internal.inputsShutdownFn]: (() => void) | undefined;

  async initialize() {
    await super.initialize();
    await this.renderer.initialize();
    this[internal.inputsShutdownFn] = this.inputs[internal.inputsRegisterHandlers]();
    this.ui[internal.uiInit]();
  }

  override shutdown() {
    this[internal.inputsShutdownFn]?.();
    this.ui[internal.uiDestroy]();
    this.local.destroy();
    super.shutdown();
    this.renderer.app.destroy({ removeView: true });
    this.network.disconnect();
  }

  readonly local: LocalRoot = new LocalRoot(this);
  readonly remote: undefined;

  [internal.submitEntityTickingOrder](entities: Entity[]) {
    super[internal.submitEntityTickingOrder](entities);
    this.local[internal.submitEntityTickingOrder](entities);
  }

  #tickAccumulator = 0;
  tickClient(delta: number): void {
    if (this.status === GameStatus.Shutdown) return;

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
    this.time[internal.timeIncrement](
      delta,
      this.paused.value ? 0 : this.#tickAccumulator / this.physics.tickDelta,
    );
    const partial = this.time.partial;

    const entityTickingOrder = this[internal.entityTickingOrder];
    const entityCount = entityTickingOrder.length;
    for (let i = 0; i < entityCount; i++) {
      entityTickingOrder[i][internal.interpolationStartFrame](partial);
    }

    this.fire(GameRender);
    this.renderer.renderFrame();
    this.fire(GamePostRender);
  }
}

export type Game = ServerGame | ClientGame;
