import { JsonValue, ValueTypeAdapter } from "../data.ts";

/**
 * SyncedValue<TextureAdapter> is the same as SyncedValue<string>,
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
 * SyncedValue<TextureArrayAdapter> is the same as SyncedValue<string[]>,
 * except we know to preload the resource when it's in a scene definition.
 */
export class TextureArrayAdapter extends ValueTypeAdapter<string[]> {
  convertToPrimitive(value: string[]): JsonValue {
    return value;
  }
  convertFromPrimitive(value: JsonValue): string[] {
    if (typeof value === "string") {
      return [value];
    }
    if (!Array.isArray(value) || !value.every(v => typeof v === "string")) {
      throw new TypeError("A textures value should be an array of strings!");
    }
    return value;
  }
}
