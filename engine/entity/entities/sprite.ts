import {
  Bounds,
  Camera,
  CameraFilterModeChanged,
  ColorAdapter,
  Entity,
  EntityContext,
  EntityEnableChanged,
  EntityTransformUpdate,
  IBounds,
  PixiEntity,
  SpriteTextureChanged,
  TextureAdapter,
} from "@dreamlab/engine";
import * as PIXI from "@dreamlab/vendor/pixi.ts";

export class Sprite extends PixiEntity {
  static {
    Entity.registerType(this, "@core");
  }

  static readonly icon = "🖼️";
  get bounds(): IBounds | undefined {
    // TODO: Reuse the same object
    return new Bounds(this.width, this.height);
  }

  width: number = 1;
  height: number = 1;
  texture: string = "";
  alpha: number = 1;
  tint: string = "white";
  preserveAspectRatio: boolean = false;

  #sprite: PIXI.Sprite | undefined;
  get sprite(): PIXI.Sprite | undefined {
    return this.#sprite;
  }

  constructor(ctx: EntityContext) {
    super(ctx);

    this.defineValue(Sprite, "texture", {
      type: TextureAdapter,
      sortOrder: 10,
      description:
        "Path to the image texture used for this sprite. Can be dragged from the project panel or typed with 'res://<path>'.",
    });

    this.defineValue(Sprite, "width", {
      description: "Logical width of the sprite (in local units).",
    });

    this.defineValue(Sprite, "height", {
      description: "Logical height of the sprite (in local units).",
    });

    this.defineValue(Sprite, "alpha", {
      description: "Opacity from 0 (invisible) to 1 (fully visible).",
    });

    this.defineValue(Sprite, "tint", {
      type: ColorAdapter,
      description: "Tint color applied to the sprite (e.g., white = no tint).",
    });

    this.defineValue(Sprite, "preserveAspectRatio", {
      description: "If true, scales the sprite to fit while maintaining original aspect ratio.",
    });

    if (this.game.isClient() && this.texture !== "") {
      // PIXI.Assets.backgroundLoad(this.game.resolveResource(this.texture));
    }

    const updateSize = () => {
      this.#updateSize();
    };

    this.on(EntityTransformUpdate, updateSize);

    const widthValue = this.values.get("width");
    const heightValue = this.values.get("height");
    const preserveAspectRatioValue = this.values.get("preserveAspectRatio");

    widthValue?.onChanged(updateSize);
    heightValue?.onChanged(updateSize);
    preserveAspectRatioValue?.onChanged(updateSize);

    const textureValue = this.values.get("texture");
    let lastTexture: string = "";
    textureValue?.onChanged(() => {
      if (this.texture === lastTexture) return;
      lastTexture = this.texture;

      const sprite = this.#sprite;
      if (!sprite) return;

      void this.#getTexture().then(texture => {
        if (this.destroyed) return;
        sprite.texture = texture;
        updateSize(); // Update size after texture changes to handle aspect ratio correctly

        this.fire(SpriteTextureChanged, this);
        this.game.fire(SpriteTextureChanged, this);
      });
    });

    // force update texture when enabled
    this.on(EntityEnableChanged, ({ enabled }) => {
      if (!enabled) return;

      if (this.texture === lastTexture) return;
      lastTexture = this.texture;

      const sprite = this.#sprite;
      if (!sprite) return;

      void this.#getTexture().then(texture => {
        if (this.destroyed) return;
        sprite.texture = texture;
        updateSize(); // Update size after texture changes to handle aspect ratio correctly

        this.fire(SpriteTextureChanged, this);
        this.game.fire(SpriteTextureChanged, this);
      });
    });

    const alphaValue = this.values.get("alpha");
    alphaValue?.onChanged(() => {
      if (!this.#sprite) return;
      this.#sprite.alpha = this.alpha;
    });

    const tintValue = this.values.get("tint");
    tintValue?.onChanged(() => {
      if (!this.#sprite) return;
      this.#sprite.tint = this.tint;
    });

    this.listen(this.game, CameraFilterModeChanged, () => {
      const sprite = this.#sprite;
      if (!sprite) return;

      void this.#getTexture().then(texture => {
        if (this.destroyed) return;
        sprite.texture = texture;
        updateSize(); // Update size after texture changes to handle aspect ratio correctly

        this.fire(SpriteTextureChanged, this);
        this.game.fire(SpriteTextureChanged, this);
      });
    });
  }

  async #getTexture(): Promise<PIXI.Texture> {
    if (this.texture === "") return PIXI.Texture.WHITE;

    const _texture = await PIXI.Assets.load(this.game.resolveResource(this.texture));
    if (!(_texture instanceof PIXI.Texture)) {
      throw new TypeError("texture is not a pixi texture");
    }

    const texture: PIXI.Texture<PIXI.TextureSource> = _texture;
    const camera = Camera.getActive(this.game);
    const scaleMode = camera?.scaleFilterMode ?? "nearest";

    texture.source.scaleMode = scaleMode;
    texture.source.update();
    texture.update();

    return texture;
  }

  #updateSize() {
    if (!this.#sprite) return;
    this.#sprite.scale.set(0);

    const targetWidth = this.width * this.globalTransform.scale.x;
    const targetHeight = this.height * this.globalTransform.scale.y;

    if (this.preserveAspectRatio && this.#sprite.texture !== PIXI.Texture.WHITE) {
      // Get original texture dimensions
      const originalWidth = this.#sprite.texture.orig.width;
      const originalHeight = this.#sprite.texture.orig.height;

      // Calculate scale factors
      const scaleX = targetWidth / originalWidth;
      const scaleY = targetHeight / originalHeight;

      // Use the smaller scale factor to maintain aspect ratio (letterboxing)
      const scale = Math.min(Math.abs(scaleX), Math.abs(scaleY));

      // Apply the scaled dimensions
      this.#sprite.width = originalWidth * scale * Math.sign(targetWidth);
      this.#sprite.height = originalHeight * scale * Math.sign(targetHeight);
    } else {
      // Original behavior - fill the entire target area
      this.#sprite.width = targetWidth;
      this.#sprite.height = targetHeight;
    }
  }

  async onInitialize() {
    super.onInitialize();
    if (!this.container) return;

    this.#sprite = new PIXI.Sprite({
      width: this.width * this.globalTransform.scale.x,
      height: this.height * this.globalTransform.scale.y,
      anchor: 0.5,
      alpha: this.alpha,
      tint: this.tint,
    });

    const texture = await this.#getTexture();
    this.#sprite.texture = texture;

    this.container.addChild(this.#sprite);

    // Apply aspect ratio preservation if needed
    if (this.preserveAspectRatio) {
      this.#updateSize();
    }

    this.fire(SpriteTextureChanged, this);
    this.game.fire(SpriteTextureChanged, this);
  }
}
