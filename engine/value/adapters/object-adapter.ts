// deno-lint-ignore-file ban-types no-explicit-any
import { JsonObject, JsonValue, ValueTypeAdapter } from "../data.ts";

const marker = Symbol("dreamlab.object-adapter.marker");
const orig = Symbol("dreamlab.object-adapter.orig");

function createMutationDetector<T extends object>(
  obj: T,
  onMutation: (target: any) => void,
): T {
  return new Proxy(obj, {
    set(target, property, value, receiver) {
      const result = Reflect.set(target, property, value, receiver);
      onMutation(target);
      return result;
    },
    deleteProperty(target, property) {
      const result = Reflect.deleteProperty(target, property);
      onMutation(target);
      return result;
    },
    has(target, property) {
      if (property === marker || property === orig) return true;
      return Reflect.has(target, property);
    },
    get(target, property, receiver) {
      if (property === marker) {
        return true;
      }
      if (property === orig) {
        return target;
      }

      const propValue = Reflect.get(target, property, receiver);

      // If the property is a function and the target is an array, intercept mutating methods
      if (typeof propValue === "function" && Array.isArray(target)) {
        const mutatingMethods = [
          "push",
          "pop",
          "shift",
          "unshift",
          "splice",
          "sort",
          "reverse",
        ];
        if (mutatingMethods.includes(property as string)) {
          return function (this: unknown, ...args: any[]) {
            const result = (propValue as Function).apply(this, args);
            onMutation(target);
            return result;
          };
        }
      }

      // For nested objects or arrays, return a proxy to detect mutations within them
      if (typeof propValue === "object" && propValue !== null) {
        return createMutationDetector(propValue, onMutation);
      }

      return propValue;
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
  convertToPrimitive(value_: JsonObject): JsonValue {
    let value = value_;
    if (orig in value) {
      value = value[orig] as JsonObject;
    }

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
    if (marker in object) {
      return object;
    } else {
      return createMutationDetector(object, () => {
        this.valueObj?.forceSync();
      });
    }
  }
}
