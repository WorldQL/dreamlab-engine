import { JsonValue, ValueTypeAdapter } from "../data.ts";

/**
 * `Value<TextureAdapter>` is the same as `Value<string>`,
 * except we know to preload the resource when it's in a scene definition.
 */
export class TextureAdapter extends ValueTypeAdapter<string> {
  convertToPrimitive(value: string): JsonValue {
    return value;
  }
  convertFromPrimitive(value: JsonValue): string {
    if (typeof value !== "string") throw new TypeError("A Texture value should be a string!");
    return value;
  }
}

/**
 * `Value<SpritesheetAdapter>` is the same as `Value<string>`,
 * except we know to preload the resource when it's in a scene definition.
 */
export class SpritesheetAdapter extends ValueTypeAdapter<string> {
  convertToPrimitive(value: string): JsonValue {
    return value;
  }
  convertFromPrimitive(value: JsonValue): string {
    if (typeof value !== "string")
      throw new TypeError("A Spritesheet value should be a string!");
    return value;
  }
}
