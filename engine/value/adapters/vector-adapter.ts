import { JsonValue, ValueTypeAdapter, Vector2 } from "@dreamlab/engine";
import { vectorOnChanged } from "@dreamlab/engine/internal";

const marked = Symbol.for("dreamlab.vector-adapter.marked");

/**
 * This supports a `Value<Vector2>`
 */
export class Vector2Adapter extends ValueTypeAdapter<Vector2> {
  isValue(value: unknown): value is Vector2 {
    if (!(value instanceof Vector2)) return false;

    // @ts-expect-error: class tainting
    return value[marked] === true;
  }
  convertToPrimitive(value: Vector2): JsonValue {
    return { x: value.x, y: value.y };
  }
  convertFromPrimitive(value: JsonValue): Vector2 {
    if (typeof value !== "object" || Array.isArray(value)) {
      throw new TypeError("A Vector2 value should be an object");
    }

    if (value === null || value === undefined) {
      const vec = Vector2.ZERO;
      // @ts-expect-error: class tainting
      vec[marked] = true;
      vec[vectorOnChanged] = () => {
        this.valueObj?.forceSync();
      };

      return vec;
    }

    if (
      !("x" in value && "y" in value) ||
      typeof value.x !== "number" ||
      typeof value.y !== "number"
    ) {
      throw new TypeError("Invalid Vector2 value");
    }

    const vec = new Vector2({ x: value.x, y: value.y });
    // @ts-expect-error: class tainting
    vec[marked] = true;
    vec[vectorOnChanged] = () => {
      this.valueObj?.forceSync();
    };

    return vec;
  }
}
