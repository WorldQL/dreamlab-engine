import { Entity, JsonValue, ValueTypeAdapter } from "@dreamlab/engine";
import * as internal from "@dreamlab/engine/internal";

function pathSegmentsFromEntity(entity: Entity): string[] {
  const path: string[] = [];
  let current: Entity | undefined = entity;
  while (current) {
    path.unshift(current.name);
    current = current.parent;
  }

  return path;
}

export function calculateRelativeEntitySelector(from: Entity, to: Entity): (string | null)[] {
  const fromSegments = pathSegmentsFromEntity(from);
  const toSegments = pathSegmentsFromEntity(to);

  let i = 0;
  while (i < toSegments.length && i < fromSegments.length) {
    const fromSegment = fromSegments[i];
    const toSegment = toSegments[i];
    if (fromSegment !== toSegment) break;

    i++;
  }

  const upSteps: (string | null)[] = fromSegments.slice(i).map(() => null);
  const downSteps: (string | null)[] = toSegments.slice(i);

  return upSteps.concat(downSteps);
}

export function resolveEntityFromRelativeSelector(entity: Entity, selector: (string | null)[]) {
  let current: Entity | undefined = entity;
  for (const element of selector) {
    if (element === null) current = current?.parent;
    else current = current?.children.get(element);
  }

  return current;
}

/**
 * Allows you to attach a behavior to this entity by dragging it into the sidebar in the editor. If you copy or clone the entity, the relative relationships will be preserved.
 *
 * Eg. if you copy from `prefabs` into `world`, the class properties will reference the entities that have been copied into the world.
 */
export class RelativeEntity extends ValueTypeAdapter<Entity | undefined> {
  isValue(value: unknown): value is Entity | undefined {
    if (value === undefined) return true;
    return value instanceof Entity;
  }
  convertToPrimitive(value: Entity | undefined): JsonValue {
    if (value === undefined) return undefined;

    const entity =
      this.valueObj?.[internal.valueRelatedEntity] ?? this[internal.valueRelatedEntity];
    if (!entity) throw new Error("unreachable");

    if (value.root !== entity.root) {
      throw new Error("RelativeEntity cannot be used to reference entities in different root!");
    }

    return calculateRelativeEntitySelector(entity, value);
  }
  convertFromPrimitive(value: JsonValue): Entity | undefined {
    if (value === undefined) return undefined;
    if (!Array.isArray(value))
      throw new TypeError("An RelativeEntity value should be an array!");

    if (!value.every(x => typeof x === "string" || x === null)) {
      throw new TypeError("Every element in RelativeEntity value array should be a string!");
    }

    const entity =
      this.valueObj?.[internal.valueRelatedEntity] ?? this[internal.valueRelatedEntity];

    const selector: (string | null)[] = value;
    if (!entity) throw new Error("unreachable");

    return resolveEntityFromRelativeSelector(entity, selector);
  }
}
