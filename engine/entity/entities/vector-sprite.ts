import {
  Bounds,
  Entity,
  EntityContext,
  EntityTransformUpdate,
  IBounds,
  PixiEntity,
  TextureAdapter,
} from "@dreamlab/engine";
import * as PIXI from "@dreamlab/vendor/pixi.ts";

export class VectorSprite extends PixiEntity {
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

  #gfx: PIXI.Graphics | undefined;
  get sprite(): PIXI.Graphics | undefined {
    return this.#gfx;
  }

  constructor(ctx: EntityContext) {
    super(ctx);

    this.defineValue(VectorSprite, "width", {
      description: "The width of the vector sprite in world units.",
    });
    this.defineValue(VectorSprite, "height", {
      description: "The height of the vector sprite in world units.",
    });
    this.defineValue(VectorSprite, "alpha", {
      description:
        "The transparency level of the sprite, from 0 (invisible) to 1 (fully opaque).",
    });
    this.defineValue(VectorSprite, "texture", {
      type: TextureAdapter,
      description:
        "The path to the vector texture asset to be rendered. Can be dragged from the project panel or typed with 'res://<path>'.",
    });

    if (this.game.isClient() && this.texture !== "") {
      PIXI.Assets.backgroundLoad(this.game.resolveResource(this.texture));
    }

    const updateSize = () => {
      if (!this.#gfx) return;
      const ctx = this.#gfx.context;
      const width = (this.width * this.globalTransform.scale.x) / ctx.bounds.width;
      const height = (this.height * this.globalTransform.scale.y) / ctx.bounds.height;
      this.#gfx.scale.set(width, height);
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

      const gfx = this.#gfx;
      if (!gfx) return;

      void this.#getTexture().then(ctx => {
        gfx.context = ctx;
      });
    });

    const alphaValue = this.values.get("alpha");
    alphaValue?.onChanged(() => {
      if (this.#gfx) this.#gfx.alpha = this.alpha;
    });
  }

  async #getTexture(): Promise<PIXI.GraphicsContext> {
    if (this.texture === "") return new PIXI.GraphicsContext();

    const texture = await PIXI.Assets.load({
      src: this.game.resolveResource(this.texture),
      data: { parseAsGraphicsContext: true },
    });

    if (!(texture instanceof PIXI.GraphicsContext)) {
      throw new TypeError("texture is not a pixi graphics context");
    }

    return texture;
  }

  async onInitialize() {
    super.onInitialize();
    if (!this.container) return;

    const ctx = await this.#getTexture();
    this.#gfx = new PIXI.Graphics(ctx);

    const width = (this.width * this.globalTransform.scale.x) / ctx.bounds.width;
    const height = (this.height * this.globalTransform.scale.y) / ctx.bounds.height;
    this.#gfx.scale.set(width, height);

    this.container.addChild(this.#gfx);
  }
}
