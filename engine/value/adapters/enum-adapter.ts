import type { Game } from "../../game.ts";
import type { AdapterTypeTag, JsonValue } from "../data.ts";
import { ValueTypeAdapter } from "../data.ts";

export declare namespace enumAdapter {
  // deno-lint-ignore no-explicit-any
  type Union<T extends AdapterTypeTag<any>> = T extends AdapterTypeTag<infer U> ? U : never;
}

export abstract class EnumAdapter<const T extends readonly string[]> extends ValueTypeAdapter<
  T[number]
> {
  constructor(
    public readonly values: T,
    game: Game,
  ) {
    super(game);
  }

  isValue(value: unknown): value is T[number] {
    if (typeof value !== "string") return false;
    return this.values.includes(value);
  }

  convertToPrimitive(value: T[number]): JsonValue {
    if (!this.isValue(value)) {
      throw new TypeError("invalid enum member");
    }
    return value;
  }

  convertFromPrimitive(value: JsonValue): T[number] {
    if (!this.isValue(value)) {
      throw new TypeError("invalid enum member");
    }
    return value;
  }
}

export function enumAdapter<const T extends readonly string[]>(
  values: T,
): AdapterTypeTag<T[number]> {
  return class ConcreteEnumAdapter extends EnumAdapter<T> {
    constructor(game: Game) {
      super(values, game);
    }
  };
}
