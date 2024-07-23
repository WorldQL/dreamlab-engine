import { Entity } from "../../entity/mod.ts";
import { JsonValue, ValueTypeAdapter } from "../data.ts";

/**
 * This supports a `Value<Entity | undefined>`
 */
export class EntityByRefAdapter extends ValueTypeAdapter<Entity | undefined> {
  convertToPrimitive(value: Entity | undefined): JsonValue {
    return value?.ref;
  }
  convertFromPrimitive(value: JsonValue): Entity | undefined {
    if (value === undefined) return undefined;
    if (typeof value !== "string")
      throw new TypeError("An EntityByRef value should be a string!");
    const ref: string = value;
    return this.game.entities.lookupByRef(ref);
  }
}
