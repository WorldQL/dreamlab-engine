import { Entity, JsonValue, ValueTypeAdapter } from "@dreamlab/engine";

/**
 * This supports a `Value<Entity | undefined>`
 */
export class EntityByRefAdapter extends ValueTypeAdapter<Entity | undefined> {
  isValue(value: unknown): value is Entity | undefined {
    if (value === undefined) return true;
    if (value === null) return true;
    return value instanceof Entity;
  }
  convertToPrimitive(value: Entity | undefined): JsonValue {
    return value?.ref ?? undefined;
  }
  convertFromPrimitive(value: JsonValue): Entity | undefined {
    if (value === undefined) return undefined;
    if (value === null) return undefined;
    if (typeof value !== "string")
      throw new TypeError("An EntityByRef value should be a string!");
    const ref: string = value;
    return this.game.entities.lookupByRef(ref);
  }
}

export { EntityByRefAdapter as EntityRef };
