import { Game } from "../game.ts";

export type Primitive = string | number | boolean | undefined;

export type JsonArray = readonly JsonValue[];
export type JsonObject = { [Key in string]?: JsonValue };
export type JsonValue = Primitive | JsonArray | JsonObject;

export abstract class ValueTypeAdapter<T> {
  constructor(public game: Game) {}

  abstract isValue(value: unknown): value is T;
  abstract convertToPrimitive(value: T): JsonValue;
  abstract convertFromPrimitive(value: JsonValue): T;
}

export type AdapterTypeTag<T> = new (game: Game) => ValueTypeAdapter<T>;
