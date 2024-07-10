import { JsonValue, ValueTypeAdapter } from "../data.ts";

export function enumAdapter<const T extends string[]>(values: T) {
  function isValid(v: unknown): v is T[number] {
    if (typeof v !== "string") return false;
    return values.includes(v);
  }

  return class EnumAdapter extends ValueTypeAdapter<T[number]> {
    convertToPrimitive(value: T[number]): JsonValue {
      if (!isValid(value)) {
        throw new TypeError("invalid enum member");
      }

      return value;
    }

    convertFromPrimitive(value: JsonValue): T[number] {
      if (!isValid(value)) {
        throw new TypeError("invalid enum member");
      }

      return value;
    }
  };
}