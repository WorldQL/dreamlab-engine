import type { Entity, Game, Value } from "@dreamlab/engine";
import * as internal from "@dreamlab/engine/internal";

export type Primitive = string | number | boolean | undefined | null;

export type JsonArray = readonly JsonValue[];
export type JsonObject = { [Key in string]?: JsonValue };
export type JsonValue = Primitive | JsonArray | JsonObject;

export abstract class ValueTypeAdapter<T> {
  [internal.valueRelatedEntity]: Entity | undefined;

  constructor(
    public game: Game,
    public valueObj?: Value<T>,
  ) {}

  abstract isValue(value: unknown): value is T;
  abstract convertToPrimitive(value: T): JsonValue;
  abstract convertFromPrimitive(value: JsonValue): T;
}

export type AdapterTypeTag<T> = new (game: Game, valueObj?: Value<T>) => ValueTypeAdapter<T>;
