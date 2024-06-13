export type Primitive = string | number | boolean | undefined;

type JsonArray = readonly JsonValue[];
type JsonObject = { [Key in string]?: JsonValue };
export type JsonValue = Primitive | JsonArray | JsonObject;

export abstract class ValueTypeAdapter<T> {
  abstract convertToPrimitive(value: T): JsonValue;
  abstract convertFromPrimitive(value: JsonValue): T;
}

export type AdapterTypeTag<T> = new () => ValueTypeAdapter<T>;
