import * as PIXI from "@dreamlab/vendor/pixi.ts";
import { EntityTransformUpdate } from "../../signals/mod.ts";
import { createIndices, createLayout, Font, loadFont, type Layout } from "../../text/fonts.ts";
import { ColorAdapter } from "../../value/adapters/color-adapter.ts";
import { enumAdapter } from "../../value/adapters/enum-adapter.ts";
import { Entity, EntityContext } from "../entity.ts";
import { PixiEntity } from "../pixi-entity.ts";
import { Camera } from "./camera.ts";

type FontFace = enumAdapter.Union<typeof FontEnumAdapter>;
const FontEnumAdapter = enumAdapter(["iosevka", "inter", "roboto", "roboto-slab", "easvhs"]);

type Align = enumAdapter.Union<typeof AlignEnumAdapter>;
const AlignEnumAdapter = enumAdapter(["left", "center", "right"]);

export class Text extends PixiEntity {
  static {
    Entity.registerType(this, "@core");
  }

  static readonly icon: string = "🔡";
  readonly bounds = undefined;

  static FONT_SOURCE_DIR = "";
  static #fonts = new Map<FontFace, Font | Promise<Font> | undefined>();

  font: FontFace = "inter";
  text: string = "Sample Text";
  color: string = "white";
  size: number = 24;
  align: Align = "left";
  outlineColor: string = "grey";
  outlineSize: number = 0;
  smoothing: number = 0.05;
  buffer: number = 0.5;
  letterSpacing: number = 1;

  #shader: PIXI.Shader | undefined;
  #geometry: PIXI.Geometry | undefined;
  #mesh: PIXI.Mesh<PIXI.Geometry, PIXI.Shader> | undefined;

  constructor(ctx: EntityContext) {
    super(ctx);

    this.defineValues(
      Text,
      "text",
      "size",
      "outlineSize",
      "smoothing",
      "buffer",
      "letterSpacing",
    );

    this.defineValue(Text, "font", { type: FontEnumAdapter });
    this.defineValue(Text, "color", { type: ColorAdapter });
    this.defineValue(Text, "align", { type: AlignEnumAdapter });
    this.defineValue(Text, "outlineColor", { type: ColorAdapter });
  }

  #generatePositions(layout: Layout) {
    const positions = new Float32Array(layout.glyphs.length * 4 * 2);
    let i = 0;
    for (const glyph of layout.glyphs) {
      const bitmap = glyph.data;

      // bottom left position
      const x = glyph.position[0] + bitmap.xoffset;
      const y = glyph.position[1] + bitmap.yoffset;

      // quad size
      const w = bitmap.width;
      const h = bitmap.height;

      // BL
      positions[i++] = x;
      positions[i++] = y;
      // TL
      positions[i++] = x;
      positions[i++] = y + h;
      // TR
      positions[i++] = x + w;
      positions[i++] = y + h;
      // BR
      positions[i++] = x + w;
      positions[i++] = y;
    }

    return positions;
  }

  #generateUVs(texture: PIXI.Texture, layout: Layout, flipY = false) {
    const texWidth = texture.width;
    const texHeight = texture.height;

    const uvs = new Float32Array(layout.glyphs.length * 4 * 2);
    let i = 0;
    for (const glyph of layout.glyphs) {
      const bitmap = glyph.data;
      const bw = bitmap.x + bitmap.width;
      const bh = bitmap.y + bitmap.height;
      // top left position
      const u0 = bitmap.x / texWidth;
      let v1 = bitmap.y / texHeight;
      const u1 = bw / texWidth;
      let v0 = bh / texHeight;
      if (flipY) {
        v1 = (texHeight - bitmap.y) / texHeight;
        v0 = (texHeight - bh) / texHeight;
      }
      // BL
      uvs[i++] = u0;
      uvs[i++] = v1;
      // TL
      uvs[i++] = u0;
      uvs[i++] = v0;
      // TR
      uvs[i++] = u1;
      uvs[i++] = v0;
      // BR
      uvs[i++] = u1;
      uvs[i++] = v1;
    }

    return uvs;
  }

  async #reflow() {
    const fontName = this.font;
    let font = Text.#fonts.get(fontName);
    if (!font) {
      font = loadFont(Text.FONT_SOURCE_DIR + `${this.font}.fnt`);
      Text.#fonts.set(fontName, font);
    }

    if (!("texture" in font)) {
      font = await font;
      Text.#fonts.set(fontName, font);
    }

    if (!this.#shader) {
      const textColor = new PIXI.Color(this.color);
      const outlineColor = new PIXI.Color(this.outlineColor);

      this.#shader = PIXI.Shader.from({
        gl: {
          vertex: `
          in vec2 aPosition;
          in vec2 aUv;

          out vec2 vUv;

          uniform mat3 uProjectionMatrix;
          uniform mat3 uWorldTransformMatrix;
          uniform mat3 uTransformMatrix;

          void main(void)
          {
            mat3 mvp = uProjectionMatrix * uWorldTransformMatrix * uTransformMatrix;
            gl_Position = vec4((mvp * vec3(aPosition, 1.0)).xy, 0.0, 1.0);

            vUv = aUv;
          }
        `,

          fragment: `
          in vec2 vUv;

          uniform sampler2D tSDF;
          uniform bool drawUV;
          uniform bool drawDistance;

          uniform vec3 textColor;
          uniform vec3 outlineColor;
          uniform float smoothing;
          uniform float buffer;
          uniform float opacity;
          uniform float outlineSize;

          void main(void)
          {
            float distance = texture2D(tSDF, vUv).a;
            float alpha = smoothstep(buffer - smoothing, buffer + smoothing, distance);
            float border = smoothstep(buffer + outlineSize - smoothing, buffer + outlineSize + smoothing, distance);
            gl_FragColor = vec4(mix(outlineColor, textColor, border), 1.) * alpha * opacity;
            //gl_FragColor = vec4(textColor, 1) * alpha * opacity;

            if(drawUV) gl_FragColor = vec4(vUv, 0, 1);
            if(drawDistance) gl_FragColor = vec4(distance);
          }
        `,
        },
        resources: {
          tSDF: font.texture.source,
          uniforms: {
            textColor: { value: textColor.toRgbArray(), type: "vec3<f32>" },
            outlineColor: { value: outlineColor.toRgbArray(), type: "vec3<f32>" },
            smoothing: { value: this.smoothing, type: "f32" },
            buffer: { value: this.buffer, type: "f32" },
            outlineSize: { value: this.outlineSize, type: "f32" },
            opacity: { value: textColor.alpha, type: "f32" },
            drawUV: { value: 0, type: "i32" },
            drawDistance: { value: 0, type: "i32" },
          },
        },
      });
    } else {
      this.#shader.resources.tSDF = font.texture.source;
    }

    const layout = createLayout({
      font,
      text: this.text,
      letterSpacing: this.letterSpacing,
      align: this.align,
    });

    const indices = createIndices({
      clockwise: true,
      type: "uint16",
      count: layout.glyphs.length,
    });

    if (this.#geometry) this.#geometry.destroy();
    this.#geometry = new PIXI.Geometry({
      indexBuffer: indices,
      attributes: {
        aPosition: this.#generatePositions(layout),
        aUv: this.#generateUVs(font.texture, layout),
      },
    });

    if (this.#mesh) {
      this.#mesh.geometry = this.#geometry;
    } else {
      this.#mesh = new PIXI.Mesh({ shader: this.#shader, geometry: this.#geometry });
      const scale = this.size / 24 / Camera.METERS_TO_PIXELS;
      this.#mesh.scale.set(
        scale * this.globalTransform.scale.x,
        scale * this.globalTransform.scale.y,
      );

      this.container!.addChild(this.#mesh);
    }

    const bounds = this.#mesh.bounds;
    this.#mesh.pivot.set(
      this.align === "left" ? 0 : this.align === "center" ? bounds.width / 2 : bounds.width,
      -bounds.height / 2,
    );
  }

  onInitialize() {
    super.onInitialize();
    if (!this.container) return;

    const updateSize = () => {
      if (!this.#mesh) return;

      const scale = this.size / 24 / Camera.METERS_TO_PIXELS;
      this.#mesh.scale.set(
        scale * this.globalTransform.scale.x,
        scale * this.globalTransform.scale.y,
      );
    };

    const fontValue = this.values.get("font");
    fontValue?.onChanged(() => {
      this.#reflow();
    });

    const textValue = this.values.get("text");
    textValue?.onChanged(() => {
      this.#reflow();
    });

    const colorValue = this.values.get("color");
    colorValue?.onChanged(() => {
      if (!this.#shader) return;

      const color = new PIXI.Color(this.color);
      const rgb = color.toRgbArray();
      const opacity = color.alpha;

      this.#shader.resources.uniforms.uniforms.textColor = rgb;
      this.#shader.resources.uniforms.uniforms.opacity = opacity;
    });

    const sizeValue = this.values.get("size");
    this.on(EntityTransformUpdate, () => updateSize());
    sizeValue?.onChanged(() => updateSize());

    const alignValue = this.values.get("align");
    alignValue?.onChanged(() => {
      this.#reflow();
    });

    const outlineColorValue = this.values.get("outlineColor");
    outlineColorValue?.onChanged(() => {
      if (!this.#shader) return;

      const color = new PIXI.Color(this.outlineColor);
      const rgb = color.toRgbArray();

      this.#shader.resources.uniforms.uniforms.outlineColor = rgb;
    });

    const outlineSizeValue = this.values.get("outlineSize");
    outlineSizeValue?.onChanged(() => {
      if (!this.#shader) return;
      this.#shader.resources.uniforms.uniforms.outlineSize = this.outlineSize;
    });

    const smoothingValue = this.values.get("smoothing");
    smoothingValue?.onChanged(() => {
      if (!this.#shader) return;
      this.#shader.resources.uniforms.uniforms.smoothing = this.smoothing;
    });

    const bufferValue = this.values.get("buffer");
    bufferValue?.onChanged(() => {
      if (!this.#shader) return;
      this.#shader.resources.uniforms.uniforms.buffer = this.buffer;
    });

    const letterSpacingValue = this.values.get("letterSpacing");
    letterSpacingValue?.onChanged(() => {
      this.#reflow();
    });

    void this.#reflow();
  }
}
