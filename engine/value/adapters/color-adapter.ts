import { JsonValue, ValueTypeAdapter } from "@dreamlab/engine";
import * as PIXI from "@dreamlab/vendor/pixi.ts";

/**
 * `Value<ColorAdapter>` is the same as `Value<string>`
 */
export class ColorAdapter extends ValueTypeAdapter<string> {
  static readonly DEFAULT_COLOR = "white";

  isValue(_value: unknown): _value is string {
    return true;
  }
  convertToPrimitive(value: string): JsonValue {
    try {
      return new PIXI.Color(value).toArray() as number[];
    } catch {
      console.warn(`invalid color: ${value}`);
      return new PIXI.Color(ColorAdapter.DEFAULT_COLOR).toArray() as number[];
    }
  }
  convertFromPrimitive(value: JsonValue): string {
    try {
      return new PIXI.Color(value as string).toHexa();
    } catch {
      console.warn(`invalid color: ${value}`);
      return ColorAdapter.DEFAULT_COLOR;
    }
  }
}
