import { initRapier } from "@dreamlab/vendor/rapier.ts";

import type {
  BehaviorConstructor,
  ClientKV,
  ClientNetworking,
  Entity,
  ISignalHandler,
  ServerKV,
  ServerNetworking,
  Signal,
  SignalConstructor,
  SignalListener,
  SignalListenerOptions,
  SignalMatching,
  SignalSubscription,
} from "@dreamlab/engine";
import {
  BehaviorLoader,
  ClickableEntity,
  DefaultSignalHandlerImpls,
  EntityStore,
  GamePostRender,
  GamePostTick,
  GamePreTick,
  GameRender,
  GameRenderer,
  GameShutdown,
  GameStatusChange,
  GameTick,
  Inputs,
  InternalGameTick,
  LocalRoot,
  PhysicsEngine,
  PrefabsRoot,
  ServerHttpAPI,
  ServerRoot,
  Time,
  UIManager,
  Value,
  ValueRegistry,
  WorldRoot,
} from "@dreamlab/engine";
import * as internal from "@dreamlab/engine/internal";
import { urlWithParams } from "@dreamlab/util/url.ts";
import * as PIXI from "@dreamlab/vendor/pixi.ts";
import { SyncedObjectRegistry } from "./synced-objects/registry.ts";

export interface GameOptions {
  instanceId: string;
  worldId: string;
  /** defaults to 60 tps */
  ticksPerSecond?: number;

  resolveResource?: (uri: string) => string;
  fetch?: (opts: {
    game: Game;
    uri: string;
    resolved: string;
    init?: RequestInit;
  }) => Promise<Response>;
}

export interface ClientGameOptions extends GameOptions {
  network: ClientNetworking;
  container: HTMLDivElement;
  cacheBuster?: string;
  kv: ClientKV | ((game: ClientGame) => ClientKV);
}
export interface ServerGameOptions extends GameOptions {
  network: ServerNetworking;
  kv: ServerKV | ((game: ServerGame) => ServerKV);
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

    // now that we know we are ServerGame | ClientGame, we can safely cast to Game

    this.instanceId = opts.instanceId;
    this.worldId = opts.worldId;

    this.#resolveResource = opts.resolveResource;
    this.#fetch = opts.fetch;

    this.time = new Time(this as unknown as Game, opts.ticksPerSecond ?? 60);
  }

  readonly signalSubscriptionMap = DefaultSignalHandlerImpls.map();

  readonly values: ValueRegistry = new ValueRegistry(this as unknown as Game);
  readonly sync: SyncedObjectRegistry = new SyncedObjectRegistry(this as unknown as Game);

  readonly entities: EntityStore = new EntityStore();

  readonly world: WorldRoot = new WorldRoot(this as unknown as Game);
  readonly prefabs: PrefabsRoot = new PrefabsRoot(this as unknown as Game);

  readonly time: Time;
  readonly inputs: Inputs = new Inputs(this as unknown as Game);

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
  protected resolveResourceURL(uri: string): URL {
    let url = new URL(uri);
    if (
      (["res:", "cloud:", "s3:"].includes(url.protocol) && url.host) ||
      url.pathname.startsWith("//")
    ) {
      url = new URL(url.href.replace(`${url.protocol}//`, `${url.protocol}`));
    }

    switch (url.protocol) {
      case "res:":
        return new URL(url.pathname, this.worldScriptBaseURL);
      case "cloud:":
      case "s3:": // s3:// URIs are discouraged; kept for backwards-compat reasons.
        return new URL(url.pathname, this.cloudAssetBaseURL);
      default:
        return new URL(uri);
    }
  }

  readonly #resolveResource: GameOptions["resolveResource"] | undefined;

  resolveResource(uri: string): string {
    if (this.#resolveResource) uri = this.#resolveResource(uri);
    return this.resolveResourceURL(uri).toString();
  }

  readonly #fetch: GameOptions["fetch"] | undefined;

  /** Fetches a resource (supports res:// and cloud:// URIs) */
  fetch(uri: string, init?: RequestInit): Promise<Response> {
    if (this.#fetch) {
      return this.#fetch({
        uri,
        init,
        resolved: this.resolveResource(uri),
        game: this as unknown as Game,
      });
    }

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

  paused: Value<boolean> = new Value<boolean>(
    this.values,
    "paused",
    false,
    false,
    Boolean,
    "paused",
  );

  #needCheckForEditMode = true;
  isEditMode = false;

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

    const entityTickingOrder = this[internal.entityTickingOrder];
    if (this[internal.entityTickingOrderDirty]) {
      entityTickingOrder.length = 0; // size list down to 0 but keep capacity (avoid expensive realloc on array grow!)
      this[internal.submitEntityTickingOrder](entityTickingOrder);
      this[internal.entityTickingOrderDirty] = false;
    }
    const entityCount = entityTickingOrder.length;

    this.time[internal.timeTick]();

    // run the pre tick phase, then a physics update, then the tick phase
    // so e.g. in Rigidbody2D we can move the body to the entity's transform,
    // have the physics world update, and then move the transform to the new position of the body.

    this.fire(GamePreTick);

    for (let i = 0; i < entityCount; i++)
      entityTickingOrder[i][internal.interpolationStartTick]();
    for (let i = 0; i < entityCount; i++)
      entityTickingOrder[i][internal.applyNetworkInterpolation]();
    this.physics.tick();
    for (let i = 0; i < entityCount; i++) {
      entityTickingOrder[i].onUpdate();
    }

    this.fire(GameTick);

    this.fire(GamePostTick);

    for (const entity of this.entities) {
      entity[internal.entityFireEnabledSignals]();
    }

    this.fire(InternalGameTick);

    // TODO stupid hack. how do I actually get this?
    if (this.#needCheckForEditMode) {
      if (this.world.children.has("EditEntities")) {
        this.isEditMode = true;
      }
      this.#needCheckForEditMode = false;
    }
  }

  shutdown() {
    if (this.status === GameStatus.Shutdown) return;

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
  fire<C extends SignalConstructor>(
    type: C,
    ...params: ConstructorParameters<C>
  ): C extends SignalConstructor<infer S> ? S : object {
    return DefaultSignalHandlerImpls.fire(this, type, ...params);
  }

  on<S extends Signal>(
    type: SignalConstructor<SignalMatching<S, this & BaseGame>>,
    listener: SignalListener<SignalMatching<S, this & BaseGame>>,
    options?: SignalListenerOptions,
  ): SignalSubscription<S> {
    const subscription = DefaultSignalHandlerImpls.on(this, type, listener, options);
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

  /**
   * Alias of {@link remote}
   */
  get server() {
    return this.remote;
  }

  readonly network: ServerNetworking;

  readonly kv: ServerKV;

  readonly httpAPI: ServerHttpAPI;

  constructor(opts: ServerGameOptions) {
    super(opts);
    this.network = opts.network;

    const kv = typeof opts.kv === "function" ? opts.kv(this) : opts.kv;
    this.kv = kv;

    this.httpAPI = new ServerHttpAPI();
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
  readonly renderer!: GameRenderer;

  readonly ui: UIManager = new UIManager(this);

  readonly network: ClientNetworking;

  readonly kv: ClientKV;

  headless = false; // used for dummygames to avoid creating tons of webgl contexts

  constructor(opts: ClientGameOptions, headless = false) {
    super(opts);

    this.container = opts.container;
    this.headless = headless;
    if (!this.headless) this.renderer = new GameRenderer(this);

    this.#cachebust = opts.cacheBuster;
    this.network = opts.network;

    const kv = typeof opts.kv === "function" ? opts.kv(this) : opts.kv;
    this.kv = kv;
  }

  [internal.inputsShutdownFn]: (() => void) | undefined;

  async initialize(options: Partial<PIXI.ApplicationOptions> = {}) {
    await super.initialize();
    if (!this.headless) await this.renderer[internal.rendererInit](options);
    this[internal.inputsShutdownFn] = this.inputs[internal.inputsRegisterHandlers]();
    this.ui[internal.uiInit]();
  }

  override shutdown() {
    this[internal.inputsShutdownFn]?.();
    this.ui[internal.uiDestroy]();
    this.local.destroy();
    super.shutdown();
    ClickableEntity[internal.clickableTeardownGame](this);
    if (!this.headless) this.renderer.app.destroy({ removeView: true });
    this.network.disconnect();
  }

  readonly local: LocalRoot = new LocalRoot(this);
  readonly remote: undefined;

  /**
   * Alias of {@link remote}
   */
  get server() {
    return this.remote;
  }

  [internal.submitEntityTickingOrder](entities: Entity[]) {
    super[internal.submitEntityTickingOrder](entities);
    this.local[internal.submitEntityTickingOrder](entities);
  }

  #cachebust: string | undefined;
  protected override resolveResourceURL(uri: string): URL {
    return urlWithParams(super.resolveResourceURL(uri), {
      __dreamlab_cache_bust: this.#cachebust,
    });
  }

  #tickAccumulator = 0;
  tickClient(delta: number): void {
    if (this.status === GameStatus.Shutdown) return;

    this.#tickAccumulator += delta * Time.TIME_SCALE;

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
      delta * Time.TIME_SCALE,
      this.paused.value ? 0 : this.#tickAccumulator / this.physics.tickDelta,
    );
    const partial = this.time.partial;

    const entityTickingOrder = this[internal.entityTickingOrder];
    const entityCount = entityTickingOrder.length;
    for (let i = 0; i < entityCount; i++) {
      entityTickingOrder[i][internal.interpolationStartFrame](partial);
    }

    this.fire(GameRender);
    this.renderer[internal.rendererRender]();
    this.fire(GamePostRender);
  }
}

export type Game = ServerGame | ClientGame;
