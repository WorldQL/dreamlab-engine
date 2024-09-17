import { JsonObject, JsonValue, ValueTypeAdapter } from "../data.ts";
import { Value } from "../value.ts";

function createAutoSyncProxy<T extends object>(object: T, valueObj: Value<JsonObject>): T {
  return new Proxy(object, {
    get: (...args) => {
      const result = Reflect.get(...args);
      if (typeof result === "object" && result !== null) {
        return createAutoSyncProxy(result, valueObj);
      }
      return result;
    },
    set: (...args) => {
      const result = Reflect.set(...args);
      valueObj.forceSync();
      return result;
    },
  });
}

/**
 * This supports any object so that it can be synced using the value system.
 * We don't really need fancy editor support for this.
 */
export class ObjectAdapter extends ValueTypeAdapter<JsonObject> {
  isValue(value: unknown): value is JsonObject {
    return typeof value === "object";
  }
  convertToPrimitive(value: JsonObject): JsonValue {
    try {
      // since the netcode needs to serialize and deserialize values,
      // you can't store any special data in a value covered by ObjectAdapter
      // (e.g. instances of user-defined classes, etc etc)
      JSON.stringify(value);
    } catch (err) {
      throw new Error("Value stored using ObjectAdapter did not contain plain data!", {
        cause: err,
      });
    }

    return value;
  }
  convertFromPrimitive(value: JsonValue): JsonObject {
    if (typeof value !== "object" || Array.isArray(value)) {
      throw new TypeError("Should be an object");
    }

    const object = value as JsonObject;
    return this.valueObj ? createAutoSyncProxy(object, this.valueObj) : object;
  }
}
