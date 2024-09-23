import * as PIXI from "@dreamlab/vendor/pixi.ts";
import { JsonValue, ValueTypeAdapter } from "../data.ts";

/**
 * `Value<ColorAdapter>` is the same as `Value<string>`
 */
export class ColorAdapter extends ValueTypeAdapter<string> {
  isValue(_value: unknown): _value is string {
    return true;
  }
  convertToPrimitive(value: string): JsonValue {
    return new PIXI.Color(value).toArray();
  }
  convertFromPrimitive(value: JsonValue): string {
    return new PIXI.Color(value as string).toHexa();
  }
}
