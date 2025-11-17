import {
  Bounds,
  Camera,
  CameraFilterModeChanged,
  ColorAdapter,
  Entity,
  EntityContext,
  EntityDestroyed,
  GameRender,
  IBounds,
  PixiEntity,
  SpriteTextureChanged,
  TextureAdapter,
  Vector2,
  Vector2Adapter,
} from "@dreamlab/engine";
import * as PIXI from "@dreamlab/vendor/pixi.ts";

export class TilingSprite extends PixiEntity {
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
  tilePosition: Vector2 = Vector2.ZERO;
  tileRotation: number = 0;
  tileScale: Vector2 = Vector2.ONE;

  #sprite: PIXI.TilingSprite | undefined;
  get sprite(): PIXI.TilingSprite | undefined {
    return this.#sprite;
  }

  constructor(ctx: EntityContext) {
    super(ctx);

    this.defineValue(TilingSprite, "width", {
      description: "The width of the tiling sprite in world units.",
    });
    this.defineValue(TilingSprite, "height", {
      description: "The height of the tiling sprite in world units.",
    });
    this.defineValue(TilingSprite, "alpha", {
      description:
        "The transparency level of the sprite, from 0 (invisible) to 1 (fully opaque).",
    });
    this.defineValue(TilingSprite, "tileRotation", {
      description: "The rotation of the tiled texture in radians.",
    });

    this.defineValue(TilingSprite, "tint", {
      type: ColorAdapter,
      description: "The tint color applied to the entire sprite.",
    });
    this.defineValue(TilingSprite, "tilePosition", {
      type: Vector2Adapter,
      description:
        "The tile offset within the texture, shifting how it appears inside the sprite.",
    });
    this.defineValue(TilingSprite, "tileScale", {
      type: Vector2Adapter,
      description: "The scale of the texture tiling relative to the sprite dimensions.",
    });
    this.defineValue(TilingSprite, "texture", {
      type: TextureAdapter,
      sortOrder: 10,
      description:
        "The texture to be used for tiling across the sprite's surface. Can be dragged from the project panel or typed with 'res://<path>'.",
    });

    if (this.game.isClient() && this.texture !== "") {
      PIXI.Assets.backgroundLoad(this.game.resolveResource(this.texture));
    }

    this.listen(this.game, GameRender, () => {
      if (!this.#sprite) return;

      this.#sprite.width = this.width * this.globalTransform.scale.x;
      this.#sprite.height = this.height * this.globalTransform.scale.y;
      this.#sprite.alpha = this.alpha;
      this.#sprite.tint = this.tint;
      this.#sprite.tilePosition = this.tilePosition;
      this.#sprite.tileRotation = this.tileRotation;

      const texture = this.#sprite.texture;
      this.#sprite.tileScale = this.tileScale.div({
        x: texture.width / this.width,
        y: texture.height / this.height,
      });
    });

    const textureValue = this.values.get("texture");
    textureValue?.onChanged(() => {
      const sprite = this.#sprite;
      if (!sprite) return;
      this.#getTexture().then(texture => {
        if (this.destroyed) return;
        sprite.texture = texture;

        this.fire(SpriteTextureChanged, this);
        this.game.fire(SpriteTextureChanged, this);
      });
    });

    this.on(EntityDestroyed, () => {
      this.#sprite?.destroy();
    });

    this.listen(this.game, CameraFilterModeChanged, () => {
      const sprite = this.#sprite;
      if (!sprite) return;
      this.#getTexture().then(texture => {
        if (this.destroyed) return;
        sprite.texture = texture;

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

  async onInitialize() {
    super.onInitialize();
    if (!this.container) return;

    this.#sprite = new PIXI.TilingSprite();
    const texture = await this.#getTexture();
    this.#sprite.texture = texture;

    this.#sprite.width = this.width * this.globalTransform.scale.x;
    this.#sprite.height = this.height * this.globalTransform.scale.y;
    this.#sprite.anchor.set(0.5);
    this.#sprite.alpha = this.alpha;
    this.#sprite.tint = this.tint;
    this.#sprite.tilePosition = this.tilePosition;
    this.#sprite.tileRotation = this.tileRotation;
    this.#sprite.tileScale = this.tileScale.div({
      x: texture.width / this.width,
      y: texture.height / this.height,
    });

    this.container.addChild(this.#sprite);

    this.fire(SpriteTextureChanged, this);
    this.game.fire(SpriteTextureChanged, this);
  }
}
