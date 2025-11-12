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

export class ColoredPolygon extends PixiEntity<PIXI.Graphics> {
  static {
    Entity.registerType(this, "@core");
  }

  static readonly icon = "🟢​";
  sides: number = 4;
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

  static readonly #HI_RES: number = 100;

  #bounds = { width: this.width, height: this.height };
  get bounds(): IBounds {
    return this.#bounds;
  }

  constructor(ctx: EntityContext) {
    super(ctx);

    this.defineValue(ColoredPolygon, "width", {
      description: "Width of the polygon in local space units.",
    });
    this.defineValue(ColoredPolygon, "height", {
      description: "Height of the polygon in local space units.",
    });
    this.defineValue(ColoredPolygon, "sides", {
      description: "Number of sides for the polygon (minimum 3).",
    });
    this.defineValue(ColoredPolygon, "color", {
      type: ColorAdapter,
      description: "Base color of the polygon. Use hex.",
    });

    this.defineValue(ColoredPolygon, "tint", {
      type: ColorAdapter,
      description: "Multiplies the color output (like a filter). Use hex.",
    });

    this.defineValue(ColoredPolygon, "borderRadius", {
      description: "Border radius (rounded edges)",
    });

    this.defineValue(ColoredPolygon, "strokeColor", {
      type: ColorAdapter,
      description: "Stroke color for the border outline.",
    });

    this.defineValue(ColoredPolygon, "strokeWidth", {
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
    const sidesValue = this.values.get("sides");

    widthValue?.onChanged(updateGfx);
    heightValue?.onChanged(updateGfx);
    sidesValue?.onChanged(updateGfx);

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

  #draw(): void {
    if (!this.#gfx) return;

    if (this.sides < 3 || this.sides > 1000) {
      console.warn("Invalid number of sides. Must be between 3 and 1000.");
      return;
    }

    const color = this.#color;
    const strokeColor = this.#strokeColor;
    const strokeWidth = Math.abs(this.strokeWidth) / 100;
    const halfWidth = Math.abs((this.width * this.globalTransform.scale.x) / 2);
    const halfHeight = Math.abs((this.height * this.globalTransform.scale.y) / 2);

    if (this.borderRadius !== 0) {
      const resolution = ColoredPolygon.#HI_RES;
      const scale = 1 / resolution;
      const hiResHalfWidth = halfWidth * resolution;
      const hiResHalfHeight = halfHeight * resolution;
      const hiResBorderRadius = Math.abs(this.borderRadius);
      const hiResStrokeWidth = strokeWidth * resolution;

      this.#gfx.clear();

      const vertices = Array.from({ length: this.sides }, (_, i) => {
        const angle = (i / this.sides) * Math.PI * 2;
        return {
          x: hiResHalfWidth * Math.cos(angle),
          y: hiResHalfHeight * Math.sin(angle),
          angle: angle,
        };
      });

      this.#drawRoundedPolygon(vertices, hiResBorderRadius);
      this.#gfx.fill({ color: color, alpha: color.alpha });

      if (strokeWidth > 0) {
        this.#gfx.stroke({
          color: strokeColor,
          alpha: strokeColor.alpha,
          width: hiResStrokeWidth,
        });
      }

      this.#gfx.scale.set(scale, scale);
    } else {
      const points = Array.from({ length: this.sides }, (_, i) => {
        const angle = (i / this.sides) * Math.PI * 2;
        return new PIXI.Point(halfWidth * Math.cos(angle), halfHeight * Math.sin(angle));
      });

      this.#gfx.clear().poly(points, true).fill({ color: color, alpha: color.alpha });

      if (strokeWidth > 0) {
        this.#gfx.stroke({ color: strokeColor, alpha: strokeColor.alpha, width: strokeWidth });
      }

      this.#gfx.scale.set(1, 1);
    }

    this.#gfx.tint = this.#tint;
  }

  #drawRoundedPolygon(
    vertices: Array<{ x: number; y: number; angle: number }>,
    radius: number,
  ): void {
    if (!this.#gfx || vertices.length < 3) return;

    const adjustedRadius = Math.min(radius, this.#getMaxRadius(vertices));

    for (let i = 0; i < vertices.length; i++) {
      const curr = vertices[i];
      const next = vertices[(i + 1) % vertices.length];
      const prev = vertices[(i + vertices.length - 1) % vertices.length];

      const toPrev = { x: prev.x - curr.x, y: prev.y - curr.y };
      const toNext = { x: next.x - curr.x, y: next.y - curr.y };

      const prevLen = Math.sqrt(toPrev.x * toPrev.x + toPrev.y * toPrev.y);
      const nextLen = Math.sqrt(toNext.x * toNext.x + toNext.y * toNext.y);

      if (prevLen === 0 || nextLen === 0) continue;

      toPrev.x /= prevLen;
      toPrev.y /= prevLen;
      toNext.x /= nextLen;
      toNext.y /= nextLen;

      const cornerStart = {
        x: curr.x + toPrev.x * adjustedRadius,
        y: curr.y + toPrev.y * adjustedRadius,
      };
      const cornerEnd = {
        x: curr.x + toNext.x * adjustedRadius,
        y: curr.y + toNext.y * adjustedRadius,
      };

      if (i === 0) {
        this.#gfx.moveTo(cornerStart.x, cornerStart.y);
      } else {
        this.#gfx.lineTo(cornerStart.x, cornerStart.y);
      }

      const angle1 = Math.atan2(toPrev.y, toPrev.x);
      const angle2 = Math.atan2(toNext.y, toNext.x);

      let angleDiff = angle2 - angle1;
      if (angleDiff > Math.PI) angleDiff -= 2 * Math.PI;
      if (angleDiff < -Math.PI) angleDiff += 2 * Math.PI;

      this.#gfx.arcTo(curr.x, curr.y, cornerEnd.x, cornerEnd.y, adjustedRadius);
    }

    this.#gfx.closePath();
  }

  #getMaxRadius(vertices: Array<{ x: number; y: number }>): number {
    let minDistance = Infinity;

    for (let i = 0; i < vertices.length; i++) {
      const curr = vertices[i];
      const next = vertices[(i + 1) % vertices.length];
      const prev = vertices[(i + vertices.length - 1) % vertices.length];

      const distToPrev = Math.sqrt(
        (curr.x - prev.x) * (curr.x - prev.x) + (curr.y - prev.y) * (curr.y - prev.y),
      );
      const distToNext = Math.sqrt(
        (curr.x - next.x) * (curr.x - next.x) + (curr.y - next.y) * (curr.y - next.y),
      );

      minDistance = Math.min(minDistance, distToPrev / 2, distToNext / 2);
    }

    return minDistance;
  }

  override createTarget(): PIXI.Graphics {
    this.#gfx = new PIXI.Graphics();
    this.#draw();

    return this.#gfx;
  }
}
