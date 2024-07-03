import { JsonObject, JsonValue, ValueTypeAdapter } from "@dreamlab/engine";

export class EditorObjectValue extends ValueTypeAdapter<JsonObject> {
  convertToPrimitive(value: JsonObject): JsonValue {
    return value;
  }
  convertFromPrimitive(value: JsonValue): JsonObject {
    // TODO: do this type safely lol
    return value as JsonObject;
  }
}
