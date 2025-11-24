import {
  ActiveCameraChanged,
  AspectRatioAdapter,
  CameraAspectChanged,
  CameraFilterModeChanged,
  ClientGame,
  Entity,
  EntityContext,
  EntityDestroyed,
  Game,
  GameRender,
  IBounds,
  IVector2,
  Vector2,
  enumAdapter,
  smoothLerpAngle,
} from "@dreamlab/engine";
import * as PIXI from "@dreamlab/vendor/pixi.ts";

type ScaleFilterMode = enumAdapter.Union<typeof ScaleFilterModeAdapter>;
const ScaleFilterModeAdapter = enumAdapter(["linear", "nearest"]);

export class Camera extends Entity {
  static {
    Entity.registerType(this, "@core");
  }

  static readonly icon = "🎥";
  public static readonly METERS_TO_PIXELS_UNSCALED = 100;
  public static get METERS_TO_PIXELS(): number {
    return this.METERS_TO_PIXELS_UNSCALED / globalThis.devicePixelRatio;
  }
  public static readonly TARGET_VIEWPORT_SIZE = 10;
  public readonly bounds: undefined;

  public readonly container: PIXI.Container | undefined;
  public unlocked: boolean = false;

  #smooth: number = 0.1;
  #lnsmooth: number = Math.log(2) / (this.#smooth * 1000);
  public get smooth(): number {
    return this.#smooth;
  }
  public set smooth(value: number) {
    this.#smooth = Math.max(value, 0);
    this.#lnsmooth = value === 0 ? 0 : Math.log(2) / (this.#smooth * 1000);
  }

  public zoom: number = 1;
  public scaleFilterMode: ScaleFilterMode = "nearest";

  public lockAspectRatio: boolean = false;
  public aspectRatio: readonly [number, number] = [1, 1];

  #position: Vector2 = new Vector2(this.interpolated.position);
  #rotation: number = this.interpolated.rotation;
  #scale: Vector2 = Vector2.splat(this.zoom === 0 ? 1 : 1 / this.zoom); // TODO: optimize this to remove the reciprocal

  #matrix() {
    const game = this.game as ClientGame;
    const resolution = globalThis.devicePixelRatio;

    let scale = 1;
    if (!this.unlocked) {
      const canvas = game.renderer.app.canvas;
      const w = canvas.width / Camera.METERS_TO_PIXELS;
      const h = canvas.height / Camera.METERS_TO_PIXELS;
      const axis = Math.min(w, h);
      scale = axis / Camera.TARGET_VIEWPORT_SIZE / resolution;
    }

    return PIXI.Matrix.shared
      .translate(-this.#position.x, this.#position.y)
      .rotate(this.#rotation)
      .scale(Camera.METERS_TO_PIXELS, Camera.METERS_TO_PIXELS)
      .scale(1 / (this.#scale.x / scale), 1 / (this.#scale.y / scale))
      .translate(
        game.renderer.app.canvas.width / 2 / resolution,
        game.renderer.app.canvas.height / 2 / resolution,
      );
  }

  get smoothed(): {
    readonly position: IVector2;
    readonly rotation: number;
    readonly scale: IVector2;
  } {
    return {
      position: this.#position.bare(),
      rotation: this.#rotation,
      scale: this.#scale.bare(),
    };
  }

  #active = false;
  get active(): boolean {
    return this.#active && this.enabled;
  }
  set active(value: boolean) {
    if (!this.game.isClient()) return;
    const game = this.game;

    // Ignore prefabs
    if (this.root === this.game.prefabs || !this.container) return;
    // Early return if destroyed
    if (this.destroyed) return;
    // Early return if activating when we are already active
    if (value && this.#active) return;
    // Early return if deactivating when we are already deactivated
    if (!value && !this.#active) return;

    const previous = Camera.getActive(this.game);
    if (!value) {
      this.#active = false;
      game.renderer.app.stage.addChild(game.renderer.scene);

      this.game.fire(ActiveCameraChanged, undefined, this);
      this.game.fire(CameraAspectChanged, this);
      this.game.fire(CameraFilterModeChanged, this);

      return;
    }

    const cameras = this.game.entities.lookupByType(Camera);
    for (const camera of cameras) {
      if (camera === this) continue;
      camera.active = false;
    }

    this.#active = true;

    // Instantly set smoothed values
    this.#position = new Vector2(this.interpolated.position);
    this.#rotation = this.interpolated.rotation;
    this.#scale = Vector2.splat(this.zoom === 0 ? 1 : 1 / this.zoom);

    // Reparent scene container
    this.container.addChild(game.renderer.scene);

    // Emit event
    this.game.fire(ActiveCameraChanged, this, previous);
    this.game.fire(CameraAspectChanged, this);
    this.game.fire(CameraFilterModeChanged, this);
  }

  // TODO: Look into improving this API maybe?
  public static getActive(game: Game): Camera | undefined {
    return game.local?.entities.lookupByType(Camera).find(camera => camera.active);
  }

  constructor(ctx: EntityContext) {
    super(ctx);

    // throw error if in world or remote
    if (this.root === this.game.world || this.root === this.game.remote) {
      throw new Error(`${this.constructor.name} must be spawned as a local client entity`);
    }

    if (this.root === this.game.local && this.game.isClient()) {
      this.container = new PIXI.Container({ eventMode: "none" });
      this.game.renderer.app.stage.addChild(this.container);

      this.listen(this.game, GameRender, () => {
        if (!this.container) return;
        if (!this.#active) return;
        const delta = this.game.time.delta;

        // No smoothing
        if (this.#lnsmooth === 0) {
          this.#position.x = this.interpolated.position.x;
          this.#position.y = this.interpolated.position.y;
          this.#rotation = this.interpolated.rotation;

          const scale = this.zoom === 0 ? 1 : 1 / this.zoom;
          this.#scale.x = scale;
          this.#scale.y = scale;

          this.container.setFromMatrix(this.#matrix());
          return;
        }

        this.#position = Vector2.smoothLerp(
          this.#position,
          this.interpolated.position,
          this.#lnsmooth,
          delta,
        );

        this.#rotation = smoothLerpAngle(
          this.#rotation,
          this.interpolated.rotation,
          this.#lnsmooth,
          delta,
        );

        const scale = Vector2.splat(this.zoom === 0 ? 1 : 1 / this.zoom);
        this.#scale = Vector2.smoothLerp(this.#scale, scale, this.#lnsmooth, delta);

        this.container.setFromMatrix(this.#matrix());
      });

      this.on(EntityDestroyed, () => {
        if (this.active) {
          // Deactivate camera
          this.active = false;
        }

        // Destroy container after
        this.container?.destroy();
      });
    }

    this.defineValue(Camera, "active", {
      replicated: false,
      description: "Whether this camera is currently active (local only).",
    });

    this.defineValue(Camera, "smooth", {
      replicated: false,
      description: "Smoothing duration in seconds. 0 = no smoothing.",
    });

    this.defineValue(Camera, "unlocked", {
      replicated: false,
      description: "Allows the camera to freely scale with resolution.",
    });

    this.defineValue(Camera, "zoom", {
      replicated: false,
      description: "Zoom level of the camera. Higher = closer in.",
    });

    const lockAspectRatio = this.defineValue(Camera, "lockAspectRatio", {
      replicated: false,
      description: "Locks the camera to a specific aspect ratio.",
    });

    const aspectRatio = this.defineValue(Camera, "aspectRatio", {
      replicated: false,
      type: AspectRatioAdapter,
      hidden: values => values.get("lockAspectRatio")?.value === false,
      description: "Target aspect ratio (width x height) to maintain.",
    });

    const scaleFilterMode = this.defineValue(Camera, "scaleFilterMode", {
      replicated: false,
      description: "Controls pixel scaling of rendered content (nearest or linear).",
    });

    scaleFilterMode.onChanged(() => {
      this.game.fire(CameraFilterModeChanged, this);
    });

    const onAspectChanged = () => {
      this.game.fire(CameraAspectChanged, this);
    };

    lockAspectRatio.onChanged(onAspectChanged);
    aspectRatio.onChanged(onAspectChanged);

    // apply new scale from incoming synced value
    this.#scale = Vector2.splat(this.zoom === 0 ? 1 : 1 / this.zoom);
  }

  onInitialize(): void {
    super.onInitialize();
    if (this.#active) {
      this.game.fire(CameraAspectChanged, this);
      this.game.fire(CameraFilterModeChanged, this);
    }
  }

  public worldToScreen(position: IVector2, interpolated = false): Vector2 {
    const game = this.game as ClientGame;
    const resolution = globalThis.devicePixelRatio;

    let scale = 1;
    if (!this.unlocked) {
      const canvas = game.renderer.app.canvas;
      const w = canvas.width / Camera.METERS_TO_PIXELS;
      const h = canvas.height / Camera.METERS_TO_PIXELS;
      const axis = Math.min(w, h);
      scale = axis / Camera.TARGET_VIEWPORT_SIZE / resolution;
    }

    const pos = interpolated ? this.#position : this.globalTransform.position;
    const matrix = PIXI.Matrix.shared
      .translate(-pos.x, pos.y)
      .rotate(this.#rotation)
      .scale(Camera.METERS_TO_PIXELS, Camera.METERS_TO_PIXELS)
      .scale(1 / (this.#scale.x / scale), 1 / (this.#scale.y / scale))
      .translate(
        game.renderer.app.canvas.width / 2 / resolution,
        game.renderer.app.canvas.height / 2 / resolution,
      );

    const { x, y } = matrix.apply({ x: position.x, y: -position.y });
    return new Vector2(x, y);
  }

  public screenToWorld(position: IVector2): Vector2 {
    const game = this.game as ClientGame;
    const resolution = globalThis.devicePixelRatio;

    let scale = 1;
    if (!this.unlocked) {
      const canvas = game.renderer.app.canvas;
      const w = canvas.width / Camera.METERS_TO_PIXELS;
      const h = canvas.height / Camera.METERS_TO_PIXELS;
      const axis = Math.min(w, h);
      scale = axis / Camera.TARGET_VIEWPORT_SIZE / resolution;
    }

    const matrix = PIXI.Matrix.shared
      .translate(-this.globalTransform.position.x, this.globalTransform.position.y)
      .rotate(this.#rotation)
      .scale(Camera.METERS_TO_PIXELS, Camera.METERS_TO_PIXELS)
      .scale(1 / (this.#scale.x / scale), 1 / (this.#scale.y / scale))
      .translate(
        game.renderer.app.canvas.width / 2 / resolution,
        game.renderer.app.canvas.height / 2 / resolution,
      );

    const { x, y } = matrix.applyInverse(position);
    return new Vector2(x, -y);
  }

  public get frustum(): IBounds {
    if (!this.game.isClient()) throw new Error("tried to access Camera.frustum on server");
    const canvas = this.game.renderer.app.canvas;

    const a = this.screenToWorld({ x: 0, y: 0 });
    const b = this.screenToWorld({ x: canvas.width, y: canvas.height });

    return { width: Math.abs(a.x - b.x), height: Math.abs(a.y - b.y) };
  }
}
