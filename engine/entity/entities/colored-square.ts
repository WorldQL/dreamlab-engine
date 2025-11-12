import {
  ColorAdapter,
  Entity,
  EntityContext,
  EntityTransformUpdate,
  IBounds,
  PixiEntity,
} from "@dreamlab/engine";
import * as PIXI from "@dreamlab/vendor/pixi.ts";

export class ColoredSquare extends PixiEntity<PIXI.Graphics> {
  static {
    Entity.registerType(this, "@core");
  }

  static readonly icon = "🟩";

  width: number = 1;
  height: number = 1;
  color: string = "white";
  tint: string = "white";
  borderRadius: number = 0;
  strokeColor: string = "black";
  strokeWidth: number = 0;

  // this seems like an ugly hack but it isn't.
  // The alternative to this is passing through signals or adding this to every entity
  // We can add this pattern to other entities if they need to avoid redrawing on every EntityTransformUpdate
  #prevGlobalScaleX = 1;
  #prevGlobalScaleY = 1;

  get #color(): PIXI.Color {
    try {
      return new PIXI.Color(this.color);
    } catch {
      return new PIXI.Color("white");
    }
  }

  get #tint(): PIXI.Color {
    try {
      return new PIXI.Color(this.tint);
    } catch {
      return new PIXI.Color("white");
    }
  }

  get #strokeColor(): PIXI.Color {
    try {
      return new PIXI.Color(this.strokeColor);
    } catch {
      return new PIXI.Color("black");
    }
  }

  #gfx: PIXI.Graphics | undefined;

  #bounds = { width: this.width, height: this.height };
  get bounds(): IBounds {
    return this.#bounds;
  }

  constructor(ctx: EntityContext) {
    super(ctx);

    this.defineValue(ColoredSquare, "width", {
      description: "Width of the square in local space units.",
    });

    this.defineValue(ColoredSquare, "height", {
      description: "Height of the square in local space units.",
    });

    this.defineValue(ColoredSquare, "color", {
      type: ColorAdapter,
      description: "Fill color of the square.",
    });

    this.defineValue(ColoredSquare, "tint", {
      type: ColorAdapter,
      description: "Tint applied as a color multiplier to the fill.",
    });

    this.defineValue(ColoredSquare, "borderRadius", {
      description: "Border radius (rounded edges)",
    });

    this.defineValue(ColoredSquare, "strokeColor", {
      type: ColorAdapter,
      description: "Stroke color for the border outline.",
    });

    this.defineValue(ColoredSquare, "strokeWidth", {
      description: "Width of the stroke border (0 = no stroke).",
    });

    const updateGfx = () => {
      this.#bounds.width = this.width;
      this.#bounds.height = this.height;
      this.#draw();
    };

    this.on(EntityTransformUpdate, () => {
      if (!this.#gfx) return;
      if (
        this.globalTransform.scale.x !== this.#prevGlobalScaleX ||
        this.globalTransform.scale.y !== this.#prevGlobalScaleY
      ) {
        updateGfx();
      }
      this.#prevGlobalScaleX = this.globalTransform.scale.x;
      this.#prevGlobalScaleY = this.globalTransform.scale.y;
    });

    const widthValue = this.values.get("width");
    const heightValue = this.values.get("height");
    widthValue?.onChanged(updateGfx);
    heightValue?.onChanged(updateGfx);

    const colorValue = this.values.get("color");
    colorValue?.onChanged(updateGfx);

    const tintValue = this.values.get("tint");
    tintValue?.onChanged(updateGfx);

    const borderRadiusValue = this.values.get("borderRadius");
    borderRadiusValue?.onChanged(updateGfx);

    const strokeColorValue = this.values.get("strokeColor");
    strokeColorValue?.onChanged(updateGfx);

    const strokeWidthValue = this.values.get("strokeWidth");
    strokeWidthValue?.onChanged(updateGfx);
  }

  /* Stroke is always uniform across the shape. Pixi does not have support for multiple stroke widths.
  TODO: Implement a way to "squish and squash" entire colored squares including their border using scale.
  This would require complex behavior with multiple Rects per draw

  Right now we've designed this to accomodate 99% of needs:
  - Build easily with ColoredSquare in the editor
  - Get consistent stroke widths regardless of shape dimensions
  - Only redraw on scale change for performance reasons.

  */

  static readonly #HI_RES: number = 100;
  #draw(): void {
    if (!this.#gfx) return;

    const width = Math.abs(this.width * this.globalTransform.scale.x);
    const height = Math.abs(this.height * this.globalTransform.scale.y);
    const color = this.#color;
    const strokeColor = this.#strokeColor;
    const strokeWidth = Math.abs(this.strokeWidth) / 100;

    if (this.borderRadius !== 0) {
      // render at 100x the size so the border radius is controllable
      // otherwise a borderRadius of 1 would make a 1x1 (in Dreamlab units) entity a jagged circle.
      const resolution = ColoredSquare.#HI_RES;
      const scale = 1 / resolution;

      const hiResWidth = width * resolution;
      const hiResHeight = height * resolution;
      const hiResBorderRadius = Math.abs(this.borderRadius);
      const hiResStrokeWidth = strokeWidth * resolution;

      this.#gfx
        .clear()
        .roundRect(
          -hiResWidth / 2,
          -hiResHeight / 2,
          hiResWidth,
          hiResHeight,
          hiResBorderRadius,
        )
        .fill({ color: color, alpha: color.alpha });

      if (strokeWidth > 0) {
        this.#gfx.stroke({
          color: strokeColor,
          alpha: strokeColor.alpha,
          width: hiResStrokeWidth,
        });
      }

      this.#gfx.scale.set(scale, scale);
    } else {
      this.#gfx
        .clear()
        .rect(-width / 2, -height / 2, width, height)
        .fill({ color: color, alpha: color.alpha });

      if (strokeWidth > 0) {
        this.#gfx.stroke({ color: strokeColor, alpha: strokeColor.alpha, width: strokeWidth });
      }

      this.#gfx.scale.set(1, 1);
    }

    this.#gfx.tint = this.#tint;
  }

  override createTarget(): PIXI.Graphics {
    this.#gfx = new PIXI.Graphics();
    this.#draw();

    return this.#gfx;
  }
}
