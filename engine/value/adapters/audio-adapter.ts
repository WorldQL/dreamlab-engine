import { JsonValue, ValueTypeAdapter } from "../data.ts";

/**
 * `Value<AudioAdapter>` is the same as `Value<string>`,
 * except we know to preload the resource when it's in a scene definition.
 */
export class AudioAdapter extends ValueTypeAdapter<string> {
  isValue(value: unknown): value is string {
    return typeof value === "string";
  }
  convertToPrimitive(value: string): JsonValue {
    return value;
  }
  convertFromPrimitive(value: JsonValue): string {
    if (typeof value !== "string") throw new TypeError("A Sound value should be a string!");
    return value;
  }
}
