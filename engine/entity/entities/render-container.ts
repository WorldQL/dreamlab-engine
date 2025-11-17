import {
  Camera,
  CameraFilterModeChanged,
  Entity,
  EntityContext,
  EntityDestroyed,
  EntityEnableChanged,
  EntityReparented,
  enumAdapter,
  PixiEntity,
  SpriteTextureChanged,
} from "@dreamlab/engine";
import * as PIXI from "@dreamlab/vendor/pixi.ts";

type ScaleFilterMode = enumAdapter.Union<typeof ScaleFilterModeAdapter>;
const ScaleFilterModeAdapter = enumAdapter(["default", "linear", "nearest"]);

export class RenderContainer extends Entity {
  static {
    Entity.registerType(this, "@core");
  }

  static readonly icon: string = "🎨";
  readonly bounds = undefined;

  resolution: number = 256;
  antialiased: boolean = true;
  scaleFilterMode: ScaleFilterMode = "default";

  #container: PIXI.Container | undefined;

  constructor(ctx: EntityContext) {
    super(ctx);

    const resolution = this.defineValue(RenderContainer, "resolution", {
      description: "", // TODO
    });

    const antialiased = this.defineValue(RenderContainer, "antialiased", {
      description: "", // TODO
    });

    const scaleFilterMode = this.defineValue(RenderContainer, "scaleFilterMode", {
      type: ScaleFilterModeAdapter,
      description: "The scale filter mode used for texture scaling (default, linear, nearest).",
    });

    resolution.onChanged(() => this.#setCacheParams());
    antialiased.onChanged(() => this.#setCacheParams());
    scaleFilterMode.onChanged(() => this.#setCacheParams());

    this.listen(this.game, CameraFilterModeChanged, () => this.#setCacheParams());

    this.on(EntityReparented, () => {
      this.#updateVisibility();
    });

    this.on(EntityEnableChanged, () => {
      this.#updateVisibility();
    });

    this.on(EntityDestroyed, () => {
      this.#container?.destroy({ children: true });
    });
  }

  #updateVisibility(): void {
    if (!this.#container) return;
    this.#container.visible = this.enabled;
  }

  static readonly #MAX_TEXEL_SIZE = 4096;
  #clampTexelDensity(): void {
    if (!this.#container) return;

    const width = this.#container.width;
    const height = this.#container.height;
    if (width === 0 || height === 0) return;
    if (width === Infinity || height === Infinity) return;

    const tx = width * this.resolution;
    const ty = height * this.resolution;
    const max = Math.max(tx, ty);
    if (max <= RenderContainer.#MAX_TEXEL_SIZE) return;

    const resolution = Number.isNaN(this.resolution) ? 256 : this.resolution;
    const res = resolution * (RenderContainer.#MAX_TEXEL_SIZE / max);
    this.resolution = Math.floor(res);

    console.warn(this.id, "RenderContainer texel density is too large, clamping resolution");
  }

  #setCacheParams(): void {
    if (!this.#container) return;

    const camera = Camera.getActive(this.game);
    const scaleMode: Exclude<ScaleFilterMode, "default"> =
      this.scaleFilterMode === "default"
        ? (camera?.scaleFilterMode ?? "nearest")
        : this.scaleFilterMode;

    this.#clampTexelDensity();
    this.#container.cacheAsTexture({
      resolution: this.resolution,
      antialias: this.antialiased,
      scaleMode,
    });

    this.#container.updateCacheTexture();
  }

  /**
   * Refresh cached texture
   */
  public refresh(): void {
    if (!this.#container) return;

    this.#clampTexelDensity();
    this.#container.updateCacheTexture();
  }

  onInitialize(): void {
    super.onInitialize();
    if (!this.game.isClient()) return;

    this.#container = new PIXI.Container();
    this.#container.eventMode = "none";
    this.#container.interactiveChildren = false;
    this.#container.sortableChildren = true;
    this.game.renderer.scene.addChild(this.#container);

    // we need to wait for all descendants to be initialized
    this.time.waitForNextTick().then(() => {
      if (!this.#container) throw new Error("container not initialized");

      for (const descendant of this.#descendants()) {
        if (!descendant.container) continue;

        this.#container.addChild(descendant.container);
      }

      this.#container.sortChildren();
      this.refresh();
    });

    // automatically refresh when sprites load a new texture
    // required because we defer sprite loading
    this.listen(this.game, SpriteTextureChanged, ({ sprite }) => {
      if (!sprite.ancestors.includes(this)) return;
      this.refresh();
    });

    // TODO: detect heirarchy changes

    this.#setCacheParams();
  }

  *#descendants(target: Entity = this): Generator<PixiEntity, void, void> {
    for (const child of target.children.values()) {
      if (child instanceof PixiEntity) yield child;
      yield* this.#descendants(child);
    }
  }
}
