import {
  Camera,
  CameraFilterModeChanged,
  ColorAdapter,
  Entity,
  EntityContext,
  EntityTransformUpdate,
  enumAdapter,
  IBounds,
  PixiEntity,
  Value,
} from "@dreamlab/engine";
import * as PIXI from "@dreamlab/vendor/pixi.ts";

type FontStyle = enumAdapter.Union<typeof FontStyleAdapter>;
const FontStyleAdapter = enumAdapter(["normal", "italic", "oblique"]);

type FontWeight = enumAdapter.Union<typeof FontWeightAdapter>;
const FontWeightAdapter = enumAdapter([
  "normal",
  "bold",
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

type ScaleFilterMode = enumAdapter.Union<typeof ScaleFilterModeAdapter>;
const ScaleFilterModeAdapter = enumAdapter(["default", "linear", "nearest"]);

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
  scaleFilterMode: ScaleFilterMode = "default";

  #text: PIXI.Text | undefined;
  #style: PIXI.TextStyle | undefined;

  get style(): PIXI.TextStyle {
    if (!this.#style) throw new Error("cannot access property 'style' on the server");
    return this.#style;
  }

  constructor(ctx: EntityContext) {
    super(ctx);

    this.defineValue(RichText, "text", {
      description: "The text content to be displayed.",
    });
    this.defineValue(RichText, "fontFamily", {
      description: "The font family used for the text.",
    });
    this.defineValue(RichText, "fontSize", {
      description: "The size of the font in pixels.",
    });

    this.defineValue(RichText, "fontStyle", {
      type: FontStyleAdapter,
      description: "The style of the font (normal, italic, oblique).",
    });

    this.defineValue(RichText, "fontWeight", {
      type: FontWeightAdapter,
      description: "The weight of the font (e.g., normal, bold, or numeric values).",
    });

    this.defineValue(RichText, "align", {
      type: AlignAdapter,
      description: "The text alignment (left, center, right).",
    });

    this.defineValue(RichText, "color", {
      type: ColorAdapter,
      description: "The color of the text.",
    });

    this.defineValue(RichText, "stroke", {
      description: "Whether the text has a stroke (outline) applied.",
    });

    const hidden: Value["hidden"] = values => values.get("stroke")?.value !== true;
    this.defineValue(RichText, "strokeColor", {
      type: ColorAdapter,
      hidden: hidden,
      description: "The color of the text stroke.",
    });

    this.defineValue(RichText, "strokeWidth", {
      hidden: hidden,
      description: "The width of the text stroke.",
    });

    this.defineValue(RichText, "strokeJoin", {
      type: StrokeJoinAdapter,
      hidden: hidden,
      description: "The join style for the stroke (round, bevel, miter).",
    });

    this.defineValue(RichText, "scaleFilterMode", {
      type: ScaleFilterModeAdapter,
      description: "The scale filter mode used for texture scaling (default, linear, nearest).",
    });

    // const scaleFilterModeValue = this.values.get("scaleFilterMode");
    // scaleFilterModeValue?.onChanged(() => {
    //   const sprite = this.#sprite;
    //   if (!sprite) return;

    //   void this.#getTexture().then(texture => {
    //     sprite.texture = texture;
    //     updateSize();
    //   });
    // });

    const fonts = new Set(["fontFamily", "fontStyle", "fontWeight"]);
    const ignored = new Set(["clonedFromRef", "static", "hidden", ...fonts]);
    for (const [key, value] of this.values) {
      if (ignored.has(key)) continue;
      value.onChanged(() => {
        this.#reflow();
      });
    }

    for (const [key, value] of this.values) {
      if (!fonts.has(key)) continue;

      value.onChanged(() => {
        void this.#loadFont();
      });
    }

    this.on(EntityTransformUpdate, () => {
      if (!this.#text) return;

      const scale = this.globalTransform.scale.div(Camera.METERS_TO_PIXELS_UNSCALED);
      this.#text.scale.set(scale.x, scale.y);
    });

    this.listen(this.game, CameraFilterModeChanged, () => {
      this.#reflow();
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

    const camera = Camera.getActive(this.game);
    const scaleMode: Exclude<ScaleFilterMode, "default"> =
      this.scaleFilterMode === "default"
        ? (camera?.scaleFilterMode ?? "nearest")
        : this.scaleFilterMode;

    this.#text.textureStyle ??= new PIXI.TextureStyle();
    this.#text.textureStyle.scaleMode = scaleMode;

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

    const scale = this.globalTransform.scale.div(Camera.METERS_TO_PIXELS_UNSCALED);
    this.#text.scale.set(scale.x, scale.y);

    const anchor = this.align === "center" ? 0.5 : this.align === "left" ? 0 : 1;
    this.#text.anchor.set(anchor, 0.5);

    const localBounds = this.container.getLocalBounds().rectangle;
    localBounds.scale(1 / this.globalTransform.scale.x, 1 / this.globalTransform.scale.y);
    const width = localBounds.width;
    const height = localBounds.height;
    const x = localBounds.x + width / 2;
    const y = localBounds.y + height / 2;

    this.#bounds = { width, height, offset: { x, y } };
    this.#text.onViewUpdate();
  }

  async #loadFont(): Promise<void> {
    if (!this.container) return;
    await document.fonts.ready;

    const family = this.fontFamily;
    const style = this.fontStyle;
    const weight = this.fontWeight;
    const fontSpecifier = `${weight} ${style} 16px "${family}"`;

    try {
      await document.fonts.load(fontSpecifier);
    } catch {
      // ignore
    } finally {
      this.rerender();
    }
  }

  async onInitialize(): Promise<void> {
    super.onInitialize();
    if (!this.container) return;

    await this.#loadFont();
    this.#reflow();
  }

  rerender(): void {
    this.#text?.destroy();
    this.#text = undefined;
    this.#style = undefined;

    this.#reflow();
  }

  #knownFonts = 0;
  onUpdate(): void {
    super.onUpdate();
    if (!this.container) return;

    // this is dumb but as far as i can see there is no event for
    // when a font is registered but not loading/loaded yet
    // ignore vs expect-error: Typechecker claims expect-error is unused.
    // @ts-ignore: for some reason this has a bad type
    const fonts: number = document.fonts.size;
    if (fonts > this.#knownFonts) {
      this.#knownFonts = fonts;
      void this.#loadFont();
    }
  }
}
