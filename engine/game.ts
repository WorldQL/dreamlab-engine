import { initRapier } from "@dreamlab/vendor/rapier.ts";

import { Value } from "@dreamlab/engine";
import { BehaviorLoader } from "./behavior/behavior-loader.ts";
import { BehaviorConstructor } from "./behavior/mod.ts";
import { EntityStore, LocalRoot, PrefabsRoot, ServerRoot, WorldRoot } from "./entity/mod.ts";
import { Inputs } from "./input/mod.ts";
import * as internal from "./internal.ts";
import { ClientNetworking, ServerNetworking } from "./network.ts";
import { PhysicsEngine } from "./physics.ts";
import { GameRenderer } from "./renderer/mod.ts";
import { ClientScene, Scene, ServerScene, tickScene } from "./scene.ts";
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

export type GameScene<G extends BaseGame> = G extends ClientGame
  ? ClientScene
  : G extends ServerGame
    ? ServerScene
    : Scene;

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
  readonly time = new Time(this as unknown as Game);
  readonly inputs = new Inputs(this as unknown as Game);

  [internal.behaviorLoader] = new BehaviorLoader(this as unknown as Game);
  loadBehavior(scriptUri: string): Promise<BehaviorConstructor> {
    return this[internal.behaviorLoader].loadScript(scriptUri);
  }

  readonly scenes: Record<string, GameScene<this>> = {};
  #currentScene: GameScene<this> | undefined;
  get currentScene(): GameScene<this> {
    if (this.#currentScene === undefined) throw new Error("There is no current scene!");
    return this.#currentScene;
  }
  set currentScene(scene: GameScene<this>) {
    this.#currentScene = scene;
  }

  get world(): WorldRoot {
    return this.currentScene.world;
  }
  get prefabs(): PrefabsRoot {
    return this.currentScene.prefabs;
  }
  // TODO: should a Game have an independent global store from the Scene ?
  get entities(): EntityStore {
    return this.currentScene.entities;
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

    for (const scene of Object.values(this.scenes)) {
      tickScene(this as unknown as Game, scene);
    }

    this.fire(GameTick);
    this.fire(GamePostTick);

    this.fire(InternalGameTick);
  }

  shutdown() {
    // TODO: destroy scenes

    this.setStatus(GameStatus.Shutdown);
    this.fire(GameShutdown);
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

  get remote(): ServerRoot {
    return this.currentScene.server;
  }
  readonly local = undefined;

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

  get local(): LocalRoot {
    return this.currentScene.local;
  }
  readonly remote = undefined;

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

    try {
      const scene = this.currentScene;
      const tickOrder = scene[internal.entityTickingOrder];
      const entityCount = tickOrder.length;
      for (let i = 0; i < entityCount; i++) {
        tickOrder[i][internal.interpolationStartFrame](partial);
      }
    } catch (_err) {
      // ignore: it's probably just that `this.currentScene` threw because we don't yet have a scene
    }

    this.fire(GameRender);
    this.renderer.renderFrame();
    this.fire(GamePostRender);
  }
}

export type Game = ServerGame | ClientGame;
