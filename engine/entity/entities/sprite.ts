import * as PIXI from "@dreamlab/vendor/pixi.ts";
import { IVector2, Vector2 } from "../../math/mod.ts";
import { EntityDestroyed, GameRender } from "../../signals/mod.ts";
import { TextureAdapter } from "../../value/adapters/texture-adapter.ts";
import { ValueChanged } from "../../value/mod.ts";
import { Entity, EntityContext } from "../entity.ts";
import { PixiEntity } from "../pixi-entity.ts";

export class Sprite2D extends PixiEntity {
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

  sprite: PIXI.Sprite | undefined;

  constructor(ctx: EntityContext) {
    super(ctx);

    this.defineValues(Sprite2D, "width", "height", "alpha");
    this.defineValue(Sprite2D, "texture", { type: TextureAdapter });

    if (this.texture !== "") {
      PIXI.Assets.backgroundLoad(this.game.resolveResource(this.texture));
    }

    this.listen(this.game, GameRender, () => {
      if (!this.sprite) return;

      this.sprite.width = this.width * this.globalTransform.scale.x;
      this.sprite.height = this.height * this.globalTransform.scale.y;
      this.sprite.alpha = this.alpha;
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
    this.sprite = new PIXI.Sprite({
      texture,
      width: this.width * this.globalTransform.scale.x,
      height: this.height * this.globalTransform.scale.y,
      anchor: 0.5,
    });

    this.container.addChild(this.sprite);
  }
}
