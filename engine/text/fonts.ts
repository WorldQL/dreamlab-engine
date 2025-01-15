import * as PIXI from "@dreamlab/vendor/pixi.ts";
// @ts-ignore no typings
import _loadFont from "https://esm.sh/load-bmfont@1.4.2?pin=v135";
// @ts-ignore no typings
import _createLayout from "npm:layout-bmfont-text@1.3.4";
// @ts-ignore no typings
import _createIndices from "npm:quad-indices@2.0.1";

// TODO: Dynamically generate compatible SDF atlases with TinySDF
// import TinySDF, { TinySDFOptions } from "npm:@mapbox/tiny-sdf@2.0.6";

export interface Font {
  chars: Character[];
  common: {
    base: number;
    lineHeight: number;
    packed: number;
    pages: number;
    scaleH: number;
    scaleW: number;
  };
  info: {
    aa: 0 | 1;
    bold: 0 | 1;
    charset: string;
    face: string;
    italic: 0 | 1;
    padding: readonly [number, number, number, number];
    size: number;
    smooth: 0 | 1;
    spacing: readonly [number, number];
    stretch: number;
    unicode: 0 | 1;
  };
  kernings: unknown[];
  pages: string[];
  texture: PIXI.Texture;
}

export interface Character {
  chnl: number;
  height: number;
  id: number;
  page: number;
  width: number;
  x: number;
  xadvance: number;
  xoffset: number;
  y: number;
  yoffset: number;
}

export function loadFont(url: string): Promise<Font> {
  return new Promise<Font>((resolve, reject) => {
    _loadFont(url, async (error: unknown, font: Font) => {
      if (error) {
        reject(error);
        return;
      }

      try {
        const _url = new URL(url, import.meta.url);
        const _url2 = new URL(font.pages[0], _url);
        const texture = await PIXI.Assets.load(_url2.toString());

        resolve(Object.assign(font, { texture }));
      } catch (error) {
        reject(error);
      }
    });
  });
}

export interface LayoutOptions {
  font: Font;
  text: string;
  width?: number;
  mode?: "pre" | "nowrap";
  align?: "left" | "center" | "right";
  letterSpacing?: number;
  lineHeight?: number;
  tabSize?: number;
  start?: number;
  end?: number;
}

export interface Layout {
  glyphs: Glyph[];
  update(opts: LayoutOptions): void;

  width: number;
  height: number;

  baseline: number;
  xHeight: number;
  descender: number;
  ascender: number;
  capHeight: number;
  lineHeight: number;
}

export interface Glyph {
  index: number;
  position: readonly [number, number];
  line: number;
  data: {
    x: number;
    y: number;
    width: number;
    height: number;
    xoffset: number;
    yoffset: number;
  };
}

export function createLayout(opts: LayoutOptions): Layout {
  return _createLayout(opts);
}

type TypedArrayBuffers = {
  int8: Int8Array;
  int16: Int16Array;
  int32: Int32Array;
  uint8: Uint8Array;
  uint16: Uint16Array;
  uint32: Uint32Array;
  float32: Float32Array;
  float64: Float64Array;
  array: number[];
  uint8_clamped: Uint8ClampedArray;
};

// deno-lint-ignore ban-types
type ArrayType = keyof TypedArrayBuffers & {};
type TypedArrayFromName<T extends ArrayType> = TypedArrayBuffers[T];

export function createIndices<T extends ArrayType>(opts: {
  count: number;
  type: T;
  clockwise?: boolean;
  start?: number;
}): TypedArrayFromName<T> {
  return _createIndices(opts);
}
