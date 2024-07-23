import * as PIXI from "@dreamlab/vendor/pixi.ts";
import { Vector2 } from "../../math/mod.ts";
import { EntityDestroyed, GameRender } from "../../signals/mod.ts";
import { TextureAdapter } from "../../value/adapters/texture-adapter.ts";
import { Vector2Adapter } from "../../value/adapters/vector-adapter.ts";
import { ValueChanged } from "../../value/mod.ts";
import { Entity, EntityContext } from "../entity.ts";
import { PixiEntity } from "../pixi-entity.ts";

export class TilingSprite2D extends PixiEntity {
  public static readonly icon = "🖼️";

  width: number = 1;
  height: number = 1;
  texture: string = "";
  alpha: number = 1;
  tilePosition: Vector2 = Vector2.ZERO;
  tileRotation: number = 0;
  tileScale: Vector2 = Vector2.ONE;

  sprite: PIXI.TilingSprite | undefined;

  constructor(ctx: EntityContext) {
    super(ctx);

    this.defineValues(TilingSprite2D, "width", "height", "alpha", "tileRotation");
    this.defineValue(TilingSprite2D, "tilePosition", { type: Vector2Adapter });
    this.defineValue(TilingSprite2D, "tileScale", { type: Vector2Adapter });
    this.defineValue(TilingSprite2D, "texture", { type: TextureAdapter });

    if (this.texture !== "") {
      PIXI.Assets.backgroundLoad(this.texture);
    }

    this.listen(this.game, GameRender, () => {
      if (!this.sprite) return;

      this.sprite.width = this.width * this.globalTransform.scale.x;
      this.sprite.height = this.height * this.globalTransform.scale.y;
      this.sprite.alpha = this.alpha;
      this.sprite.tilePosition = this.tilePosition;
      this.sprite.tileRotation = this.tileRotation;

      const texture = this.sprite.texture;
      this.sprite.tileScale = this.tileScale.div({
        x: texture.width / this.width,
        y: texture.height / this.height,
      });
    });

    const textureValue = this.values.get("texture");
    this.listen(this.game.values, ValueChanged, async event => {
      if (!this.sprite) return;
      if (event.value !== textureValue) return;

      const texture = await this.#getTexture();
      this.sprite.texture = texture;
    });

    this.on(EntityDestroyed, () => {
      this.sprite?.destroy();
    });
  }

  async #getTexture(): Promise<PIXI.Texture> {
    if (this.texture === "") return PIXI.Texture.WHITE;

    const texture = await PIXI.Assets.load(this.texture);
    if (!(texture instanceof PIXI.Texture)) {
      throw new TypeError("texture is not a pixi texture");
    }

    return texture;
  }

  async onInitialize() {
    super.onInitialize();
    if (!this.container) return;

    const texture = await this.#getTexture();
    this.sprite = new PIXI.TilingSprite(texture);

    this.sprite.width = this.width * this.globalTransform.scale.x;
    this.sprite.height = this.height * this.globalTransform.scale.y;
    this.sprite.anchor.set(0.5);
    this.sprite.alpha = this.alpha;
    this.sprite.tilePosition = this.tilePosition;
    this.sprite.tileRotation = this.tileRotation;
    this.sprite.tileScale = this.tileScale.div({
      x: texture.width / this.width,
      y: texture.height / this.height,
    });

    this.container.addChild(this.sprite);
  }
}

Entity.registerType(TilingSprite2D, "@core");
