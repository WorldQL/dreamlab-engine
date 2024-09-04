import type { AdapterTypeTag, JsonValue } from "../data.ts";
import { ValueTypeAdapter } from "../data.ts";

export declare namespace enumAdapter {
  // deno-lint-ignore no-explicit-any
  type Union<T extends AdapterTypeTag<any>> = T extends AdapterTypeTag<infer U> ? U : never;
}

export function enumAdapter<const T extends readonly string[]>(values: T) {
  function isValid(v: unknown): v is T[number] {
    if (typeof v !== "string") return false;
    return values.includes(v);
  }

  return class EnumAdapter extends ValueTypeAdapter<T[number]> {
    isValue(value: unknown): value is T[number] {
      return isValid(value);
    }
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
