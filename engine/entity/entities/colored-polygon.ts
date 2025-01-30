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

export class ColoredPolygon extends PixiEntity {
  static {
    Entity.registerType(this, "@core");
  }

  static readonly icon = "🟢​";
  sides: number = 4;
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

  get bounds(): IBounds | undefined {
    // TODO: Reuse the same object
    return new Bounds(this.width, this.height);
  }

  constructor(ctx: EntityContext) {
    super(ctx);

    this.defineValues(ColoredPolygon, "width", "height", "sides");
    this.defineValue(ColoredPolygon, "color", { type: ColorAdapter });

    const updateGfx = () => {
      this.#draw();
    };

    this.on(EntityTransformUpdate, updateGfx);

    const widthValue = this.values.get("width");
    const heightValue = this.values.get("height");
    const sidesValue = this.values.get("sides");

    widthValue?.onChanged(updateGfx);
    heightValue?.onChanged(updateGfx);
    sidesValue?.onChanged(updateGfx);

    const colorValue = this.values.get("color");
    colorValue?.onChanged(updateGfx);
  }

  #draw(): void {
    if (!this.#gfx) return;

    if (this.sides < 3) {
      console.warn("Invalid number of sides. Must be 3 or more.");
      return;
    }

    const color = this.#color;
    const halfWidth = Math.abs((this.width * this.globalTransform.scale.x) / 2);
    const halfHeight = Math.abs((this.height * this.globalTransform.scale.y) / 2);

    const points = Array.from({ length: this.sides }, (_, i) => {
      const angle = (i / this.sides) * Math.PI * 2;
      return new PIXI.Point(halfWidth * Math.cos(angle), halfHeight * Math.sin(angle));
    });

    this.#gfx.clear().poly(points, true).fill({ color: color, alpha: color.alpha });
  }

  onInitialize() {
    super.onInitialize();
    if (!this.container) return;

    this.#gfx = new PIXI.Graphics();
    this.#draw();

    this.container.addChild(this.#gfx);
  }
}
