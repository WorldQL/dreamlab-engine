import {
  Bounds,
  ColorAdapter,
  Entity,
  EntityContext,
  EntityTransformUpdate,
  IBounds,
  PixiEntity,
} from "@dreamlab/engine";
import * as PIXI from "@dreamlab/vendor/pixi.ts";

/**
 * @deprecated Use `ColoredSquare` entity instead
 */
export class SolidColor extends PixiEntity {
  static {
    Entity.registerType(this, "@core");
  }

  static readonly icon = "🟪";
  get bounds(): IBounds | undefined {
    // TODO: Reuse the same object
    return new Bounds(this.width, this.height);
  }

  width: number = 1;
  height: number = 1;
  color: string = "white";

  get #color(): PIXI.Color {
    try {
      return new PIXI.Color(this.color);
    } catch {
      return new PIXI.Color("white");
    }
  }

  #gfx: PIXI.Graphics | undefined;

  constructor(ctx: EntityContext) {
    super(ctx);

    this.defineValues(SolidColor, "width", "height");
    this.defineValue(SolidColor, "color", { type: ColorAdapter });

    const updateGfx = () => {
      this.#draw();
    };

    this.on(EntityTransformUpdate, updateGfx);
    const widthValue = this.values.get("width");
    const heightValue = this.values.get("height");
    widthValue?.onChanged(updateGfx);
    heightValue?.onChanged(updateGfx);

    const colorValue = this.values.get("color");
    colorValue?.onChanged(updateGfx);
  }

  #draw(): void {
    if (!this.#gfx) return;

    const width = this.width * this.globalTransform.scale.x;
    const height = this.height * this.globalTransform.scale.y;
    const color = this.#color;
    this.#gfx
      .clear()
      .rect(-width / 2, -height / 2, width, height)
      .fill({ color: color, alpha: color.alpha });
  }

  onInitialize() {
    super.onInitialize();
    if (!this.container) return;

    this.#gfx = new PIXI.Graphics();
    this.#draw();

    this.container.addChild(this.#gfx);
  }
}
