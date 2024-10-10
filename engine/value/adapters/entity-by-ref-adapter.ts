import { Entity } from "../../entity/mod.ts";
import { JsonValue, ValueTypeAdapter } from "../data.ts";
import { ReceivedInitialNetworkSnapshot } from "../../../proto/common/signals.ts";

/**
 * This supports a `Value<Entity | undefined>`
 */
export class EntityByRefAdapter extends ValueTypeAdapter<Entity | undefined> {
  isValue(value: unknown): value is Entity | undefined {
    if (value === undefined) return true;
    return value instanceof Entity;
  }
  convertToPrimitive(value: Entity | undefined): JsonValue {
    return value?.ref;
  }
  convertFromPrimitive(value: JsonValue): Entity | undefined {
    if (value === undefined) return undefined;
    if (typeof value !== "string")
      throw new TypeError("An EntityByRef value should be a string!");
    const ref: string = value;
    const entity = this.game.entities.lookupByRef(ref);
    if (entity === undefined) {
      console.log("lookup failed for " + ref);
      setTimeout(() => {
        // now our lookup succeeds
        const entity = this.game.entities.lookupByRef(ref);
        console.log(entity);
      }, 1000)
    }
    return entity;
  }
}
