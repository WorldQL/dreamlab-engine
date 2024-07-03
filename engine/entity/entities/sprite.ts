import * as PIXI from "@dreamlab/vendor/pixi.ts";
import { EntityDestroyed, GameRender } from "../../signals/mod.ts";
import { TextureAdapter } from "../../value/adapters/texture-adapter.ts";
import { SyncedValueChanged } from "../../value/mod.ts";
import { Entity, EntityContext } from "../entity.ts";
import { PixiEntity } from "../pixi-entity.ts";

export class Sprite2D extends PixiEntity {
  public static readonly icon = "🖼️";

  width: number = 1;
  height: number = 1;
  texture: string = "";
  alpha: number = 1;

  #sprite: PIXI.Sprite | undefined;

  constructor(ctx: EntityContext) {
    super(ctx);

    this.defineValues(Sprite2D, "width", "height", "alpha");
    this.value(Sprite2D, "texture", { type: TextureAdapter });

    if (this.texture !== "") {
      PIXI.Assets.backgroundLoad(this.texture);
    }

    this.listen(this.game, GameRender, () => {
      if (!this.#sprite) return;

      this.#sprite.width = this.width * this.globalTransform.scale.x;
      this.#sprite.height = this.height * this.globalTransform.scale.y;
      this.#sprite.alpha = this.alpha;
    });

    const textureValue = this.values.get("texture");
    this.listen(this.game.syncedValues, SyncedValueChanged, async event => {
      if (!this.#sprite) return;
      if (event.value !== textureValue) return;

      const texture = await this.#getTexture();
      this.#sprite.texture = texture;
    });

    this.on(EntityDestroyed, () => {
      this.#sprite?.destroy();
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
    this.#sprite = new PIXI.Sprite({
      texture,
      width: this.width * this.globalTransform.scale.x,
      height: this.height * this.globalTransform.scale.y,
      position: {
        x: this.globalTransform.position.x,
        y: -this.globalTransform.position.y,
      },
      rotation: this.globalTransform.rotation,
      anchor: 0.5,
    });

    this.container.addChild(this.#sprite);
  }
}

Entity.registerType(Sprite2D, "@core");
