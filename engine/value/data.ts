import { Game } from "../game.ts";

export type Primitive = string | number | boolean | undefined;

type JsonArray = readonly JsonValue[];
type JsonObject = { [Key in string]?: JsonValue };
export type JsonValue = Primitive | JsonArray | JsonObject;

export abstract class ValueTypeAdapter<T> {
  constructor(protected game: Game) {}

  abstract convertToPrimitive(value: T): JsonValue;
  abstract convertFromPrimitive(value: JsonValue): T;
}

export type AdapterTypeTag<T> = new (game: Game) => ValueTypeAdapter<T>;
