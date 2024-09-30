import * as PIXI from "@dreamlab/vendor/pixi.ts";
import { IVector2, Vector2 } from "../../math/mod.ts";
import { EntityTransformUpdate } from "../../signals/mod.ts";
import { ColorAdapter } from "../../value/adapters/color-adapter.ts";
import { Entity, EntityContext } from "../entity.ts";
import { PixiEntity } from "../pixi-entity.ts";

export class SolidColor extends PixiEntity {
  static {
    Entity.registerType(this, "@core");
  }

  public static readonly icon = "🟪";
  get bounds(): Readonly<IVector2> | undefined {
    // TODO: Reuse the same vector
    return new Vector2(this.width, this.height);
  }

  width: number = 1;
  height: number = 1;
  color: string = "white";

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
    const color = new PIXI.Color(this.color);
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
