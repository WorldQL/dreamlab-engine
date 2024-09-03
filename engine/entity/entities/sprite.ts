import { EntityTransformUpdate } from "@dreamlab/engine";
import * as PIXI from "@dreamlab/vendor/pixi.ts";
import { IVector2, Vector2 } from "../../math/mod.ts";
import { TextureAdapter } from "../../value/adapters/texture-adapter.ts";
import { Entity, EntityContext } from "../entity.ts";
import { PixiEntity } from "../pixi-entity.ts";

export class Sprite extends PixiEntity {
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

  #sprite: PIXI.Sprite | undefined;
  get sprite(): PIXI.Sprite | undefined {
    return this.#sprite;
  }

  constructor(ctx: EntityContext) {
    super(ctx);

    this.defineValues(Sprite, "width", "height", "alpha");
    this.defineValue(Sprite, "texture", { type: TextureAdapter });

    if (this.game.isClient() && this.texture !== "") {
      // PIXI.Assets.backgroundLoad(this.game.resolveResource(this.texture));
    }

    const updateSize = () => {
      if (!this.#sprite) return;
      this.#sprite.scale.set(0);
      this.#sprite.width = this.width * this.globalTransform.scale.x;
      this.#sprite.height = this.height * this.globalTransform.scale.y;
    };

    this.on(EntityTransformUpdate, updateSize);
    const widthValue = this.values.get("width");
    const heightValue = this.values.get("height");
    widthValue?.onChanged(updateSize);
    heightValue?.onChanged(updateSize);

    const textureValue = this.values.get("texture");
    let lastTexture: string = "";
    textureValue?.onChanged(() => {
      if (this.texture === lastTexture) return;
      lastTexture = this.texture;

      const sprite = this.#sprite;
      if (!sprite) return;

      void this.#getTexture().then(texture => {
        sprite.texture = texture;
      });
    });

    const alphaValue = this.values.get("alpha");
    alphaValue?.onChanged(() => {
      if (!this.#sprite) return;
      this.#sprite.alpha = this.alpha;
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
    this.#sprite = new PIXI.Sprite({
      texture,
      width: this.width * this.globalTransform.scale.x,
      height: this.height * this.globalTransform.scale.y,
      anchor: 0.5,
    });

    this.container.addChild(this.#sprite);
  }
}
