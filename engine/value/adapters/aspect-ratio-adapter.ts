import { JsonValue, ValueTypeAdapter } from "@dreamlab/engine";

export class AspectRatioAdapter extends ValueTypeAdapter<readonly [number, number]> {
  isValue(value: unknown): value is readonly [number, number] {
    if (value === null) return false;
    if (typeof value !== "object") return false;
    if (!Array.isArray(value)) return false;
    if (value.length !== 2) return false;

    const [w, h] = value;
    return typeof w === "number" && typeof h === "number";
  }
  convertToPrimitive(value: readonly [number, number]): JsonValue {
    return value;
  }
  convertFromPrimitive(value: JsonValue): readonly [number, number] {
    if (!this.isValue(value)) {
      throw new TypeError("An Aspect Ratio value should be a 2-tuple of numbers");
    }

    return value;
  }
}
