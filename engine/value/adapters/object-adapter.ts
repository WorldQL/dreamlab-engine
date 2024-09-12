import { JsonValue, ValueTypeAdapter } from "../data.ts";

/**
 * This supports any object so that it can be synced using the value system.
 * We don't really need fancy editor support for this.
 */
export class ObjectAdapter extends ValueTypeAdapter<object> {
  isValue(value: unknown): value is object {
    return typeof value === "object";
  }
  convertToPrimitive(value: object): object {
    return value;
  }
  convertFromPrimitive(value: JsonValue): object {
    if (typeof value !== "object" || Array.isArray(value)) {
      throw new TypeError("Should be an object");
    }

    return value
  }
}
