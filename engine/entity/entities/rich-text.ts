import * as PIXI from "@dreamlab/vendor/pixi.ts";
import type { IBounds } from "../../math/mod.ts";
import { EntityTransformUpdate } from "../../signals/mod.ts";
import { ColorAdapter } from "../../value/adapters/color-adapter.ts";
import { enumAdapter } from "../../value/adapters/enum-adapter.ts";
import { Value } from "../../value/value.ts";
import { Entity, EntityContext } from "../entity.ts";
import { PixiEntity } from "../pixi-entity.ts";
import { Camera } from "./camera.ts";

type FontStyle = enumAdapter.Union<typeof FontStyleAdapter>;
const FontStyleAdapter = enumAdapter(["normal", "italic", "oblique"]);

type FontWeight = enumAdapter.Union<typeof FontWeightAdapter>;
const FontWeightAdapter = enumAdapter([
  "normal",
  "bold",
  "bolder",
  "lighter",
  "100",
  "200",
  "300",
  "400",
  "500",
  "600",
  "700",
  "800",
  "900",
]);

type Align = enumAdapter.Union<typeof AlignAdapter>;
const AlignAdapter = enumAdapter(["left", "center", "right"]);

type StrokeJoin = enumAdapter.Union<typeof StrokeJoinAdapter>;
const StrokeJoinAdapter = enumAdapter(["round", "bevel", "miter"]);

export class RichText extends PixiEntity {
  static {
    Entity.registerType(this, "@core");
  }

  static readonly icon: string = "🔡";

  #bounds: IBounds | undefined;
  get bounds(): IBounds | undefined {
    return this.#bounds;
  }

  text: string = "Sample Text";
  fontFamily: string = "Inter";
  fontSize: number = 36;
  fontStyle: FontStyle = "normal";
  fontWeight: FontWeight = "normal";
  align: Align = "center";
  color: string = "white";
  stroke: boolean = false;
  strokeColor: string = "black";
  strokeWidth: number = 3;
  strokeJoin: StrokeJoin = "round";

  #text: PIXI.Text | undefined;
  #style: PIXI.TextStyle | undefined;

  get style(): PIXI.TextStyle {
    if (!this.#style) throw new Error("cannot access property 'style' on the server");
    return this.#style;
  }

  constructor(ctx: EntityContext) {
    super(ctx);

    this.defineValues(RichText, "text", "fontFamily", "fontSize");
    this.defineValue(RichText, "fontStyle", { type: FontStyleAdapter });
    this.defineValue(RichText, "fontWeight", { type: FontWeightAdapter });
    this.defineValue(RichText, "align", { type: AlignAdapter });
    this.defineValue(RichText, "color", { type: ColorAdapter });

    this.defineValue(RichText, "stroke");
    const hidden: Value["hidden"] = values => values.get("stroke")?.value !== true;
    this.defineValue(RichText, "strokeColor", { type: ColorAdapter, hidden: hidden });
    this.defineValue(RichText, "strokeWidth", { hidden: hidden });
    this.defineValue(RichText, "strokeJoin", { type: StrokeJoinAdapter, hidden: hidden });

    const ignored = new Set(["clonedFromRef", "static", "hidden"]);
    for (const [key, value] of this.values) {
      if (ignored.has(key)) continue;
      value.onChanged(() => {
        this.#reflow();
      });
    }

    this.on(EntityTransformUpdate, () => {
      if (!this.#text) return;

      const scale = this.globalTransform.scale.div(Camera.METERS_TO_PIXELS);
      this.#text.scale.set(scale.x, scale.y);
    });
  }

  #reflow(): void {
    if (!this.container) return;

    if (!this.#text) {
      this.#text = new PIXI.Text();
      this.container.addChild(this.#text);
    }

    this.#style ??= new PIXI.TextStyle();
    this.#style.fontFamily = this.fontFamily;
    this.#style.fontSize = this.fontSize;
    this.#style.fontStyle = this.fontStyle;
    this.#style.fontWeight = this.fontWeight;
    this.#style.fill = this.color;

    if (this.stroke) {
      this.#style.stroke = {
        color: this.strokeColor,
        width: this.strokeWidth,
        join: this.strokeJoin,
      };
    } else {
      this.#style.stroke = "transparent";
    }

    this.#text.style = this.#style;
    this.#text.text = this.text;

    const scale = this.globalTransform.scale.div(Camera.METERS_TO_PIXELS);
    this.#text.scale.set(scale.x, scale.y);

    const anchor = this.align === "center" ? 0.5 : this.align === "left" ? 0 : 1;
    this.#text.anchor.set(anchor, 0.5);

    const localBounds = this.container.getLocalBounds().rectangle;
    const width = localBounds.width;
    const height = localBounds.height;
    const x = localBounds.x + width / 2;
    const y = localBounds.y + height / 2;

    this.#bounds = { width, height, offset: { x, y } };
  }

  onInitialize(): void {
    super.onInitialize();
    if (!this.container) return;

    this.#reflow();
  }
}
