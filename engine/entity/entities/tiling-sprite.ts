import * as PIXI from "@dreamlab/vendor/pixi.ts";
import { IVector2, Vector2 } from "../../math/mod.ts";
import { EntityDestroyed, GameRender } from "../../signals/mod.ts";
import { TextureAdapter } from "../../value/adapters/texture-adapter.ts";
import { Vector2Adapter } from "../../value/adapters/vector-adapter.ts";
import { Entity, EntityContext } from "../entity.ts";
import { PixiEntity } from "../pixi-entity.ts";

export class TilingSprite extends PixiEntity {
  static {
    Entity.registerType(this, "@core");
  }

  public static readonly icon = "🖼️";
  get bounds(): Readonly<IVector2> | undefined {
    // TODO: Reuse the same vector
    return new Vector2(this.width, this.height);
  }

  width: number = 1;
  height: number = 1;
  texture: string = "";
  alpha: number = 1;
  tilePosition: Vector2 = Vector2.ZERO;
  tileRotation: number = 0;
  tileScale: Vector2 = Vector2.ONE;

  #sprite: PIXI.TilingSprite | undefined;
  get sprite(): PIXI.TilingSprite | undefined {
    return this.#sprite;
  }

  constructor(ctx: EntityContext) {
    super(ctx);

    this.defineValues(TilingSprite, "width", "height", "alpha", "tileRotation");
    this.defineValue(TilingSprite, "tilePosition", { type: Vector2Adapter });
    this.defineValue(TilingSprite, "tileScale", { type: Vector2Adapter });
    this.defineValue(TilingSprite, "texture", { type: TextureAdapter });

    if (this.game.isClient() && this.texture !== "") {
      PIXI.Assets.backgroundLoad(this.game.resolveResource(this.texture));
    }

    this.listen(this.game, GameRender, () => {
      if (!this.#sprite) return;

      this.#sprite.width = this.width * this.globalTransform.scale.x;
      this.#sprite.height = this.height * this.globalTransform.scale.y;
      this.#sprite.alpha = this.alpha;
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
        sprite.texture = texture;
      });
    });

    this.on(EntityDestroyed, () => {
      this.#sprite?.destroy();
    });
  }

  async #getTexture(): Promise<PIXI.Texture> {
    if (this.texture === "") return PIXI.Texture.WHITE;

    const texture = await PIXI.Assets.load(this.game.resolveResource(this.texture));
    if (!(texture instanceof PIXI.Texture)) {
      throw new TypeError("texture is not a pixi texture");
    }

    return texture;
  }

  async onInitialize() {
    super.onInitialize();
    if (!this.container) return;

    const texture = await this.#getTexture();
    this.#sprite = new PIXI.TilingSprite(texture);

    this.#sprite.width = this.width * this.globalTransform.scale.x;
    this.#sprite.height = this.height * this.globalTransform.scale.y;
    this.#sprite.anchor.set(0.5);
    this.#sprite.alpha = this.alpha;
    this.#sprite.tilePosition = this.tilePosition;
    this.#sprite.tileRotation = this.tileRotation;
    this.#sprite.tileScale = this.tileScale.div({
      x: texture.width / this.width,
      y: texture.height / this.height,
    });

    this.container.addChild(this.#sprite);
  }
}
