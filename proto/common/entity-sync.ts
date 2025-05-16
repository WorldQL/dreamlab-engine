import {
  Behavior,
  BehaviorConstructor,
  BehaviorDefinition,
  Entity,
  EntityConstructor,
  EntityDefinition,
  Game,
  TransformOptions,
} from "@dreamlab/engine";
import * as internal from "@dreamlab/engine/internal";
import type { z } from "@dreamlab/vendor/zod.ts";
import {
  BehaviorDefinitionSchema,
  BehaviorDefinitionSchemaType,
  EntityDefinitionSchema,
  EntityDefinitionSchemaType,
  TransformSchema,
  ValuesSchemaType,
} from "../datamodel.ts";

export const convertBehaviorDefinition = async (
  game: Game,
  def: z.infer<typeof BehaviorDefinitionSchema>,
): Promise<BehaviorDefinition> => {
  const type = await game[internal.behaviorLoader].loadScript(def.script);
  return {
    _ref: def.ref,
    type,
    values: def.values,
    sync: def.sync,
  };
};

export const convertEntityDefinition = async (
  game: Game,
  def: z.infer<typeof EntityDefinitionSchema>,
): Promise<EntityDefinition> => {
  const behaviorsPromise = def.behaviors?.map(behavior =>
    convertBehaviorDefinition(game, behavior),
  );
  const behaviors = behaviorsPromise ? await Promise.all(behaviorsPromise) : undefined;

  const childrenPromise = def.children?.map(child => convertEntityDefinition(game, child));
  const children = childrenPromise ? await Promise.all(childrenPromise) : undefined;

  return {
    _ref: def.ref,
    type: Entity.getEntityType(def.type),
    name: def.name,
    enabled: def.enabled,
    values: def.values,
    transform: def.transform,
    authority: def.authority,
    behaviors,
    children,
  };
};

export const serializeTransform = (
  transform: TransformOptions,
): z.infer<typeof TransformSchema> => {
  return {
    position: transform.position
      ? { x: transform.position.x ?? 0, y: transform.position.y ?? 0 }
      : { x: 0, y: 0 },
    rotation: transform.rotation ?? 0,
    scale: transform.scale
      ? { x: transform.scale.x ?? 1, y: transform.scale.y ?? 1 }
      : { x: 1, y: 1 },
    z: transform.z ?? 0,
  };
};

export const serializeBehaviorDefinition = (
  game: Game,
  def: BehaviorDefinition,
): z.infer<typeof BehaviorDefinitionSchema> => {
  const ref = def._ref;
  if (ref === undefined)
    throw new Error("attempted to serialize BehaviorDefinition with undefined ref");

  const script = game[internal.behaviorLoader].lookup(def.type);
  if (script === undefined)
    throw new Error("attempted to serialize BehaviorDefinition with unknown script location");

  return {
    ref,
    script,
    values: def.values ?? {},
    sync: {}, // TODO
  };
};

export const serializeEntityDefinition = (
  game: Game,
  def: EntityDefinition,
  parentRef: string,
): z.infer<typeof EntityDefinitionSchema> => {
  const ref = def._ref;
  if (ref === undefined)
    throw new Error("Attempted to serialize EntityDefinition with undefined ref");

  const children = def.children
    ? def.children
        .values()
        .map(child => serializeEntityDefinition(game, child, ref))
        .toArray()
    : undefined;

  const behaviors = def.behaviors
    ? def.behaviors.map(behavior => serializeBehaviorDefinition(game, behavior))
    : undefined;

  return {
    type: Entity.getTypeName(def.type),
    name: def.name,
    enabled: def.enabled,
    values: def.values,
    transform: def.transform ? serializeTransform(def.transform) : undefined,
    authority: def.authority,
    behaviors,
    children,
    ref,
    parent: parentRef,
  };
};

export const getAllEntityRefs = (def: EntityDefinition, refs?: Set<string>): Set<string> => {
  const refSet = refs ?? new Set<string>();
  if (def._ref) refSet.add(def._ref);
  def.children?.forEach(c => getAllEntityRefs(c, refSet));
  return refSet;
};

export const createValuesDefinition = (container: Entity | Behavior): ValuesSchemaType => {
  const values: ValuesSchemaType = {};

  for (const [name, syncedValue] of container.values.entries()) {
    values[name] = {
      clock: syncedValue.clock,
      source: syncedValue.lastSource,
      value: syncedValue.adapter
        ? syncedValue.adapter.convertToPrimitive(syncedValue.value)
        : syncedValue.value,
    };
  }

  return values;
};

export const createBehaviorDefinition = (behavior: Behavior): BehaviorDefinitionSchemaType => {
  const script = behavior.game[internal.behaviorLoader].lookup(
    behavior.constructor as BehaviorConstructor,
  );
  if (!script) throw new Error("entity sync: behavior has unknown script source");

  return {
    ref: behavior.ref,
    script,
    sync: {}, // TODO: sync the guy
    values: createValuesDefinition(behavior),
  };
};

export const createEntityDefinition = (entity: Entity): EntityDefinitionSchemaType => {
  const parent = entity.parent?.ref;
  if (!parent) throw new Error("entity sync: entity has no parent!");

  return {
    parent,
    type: Entity.getTypeName(entity.constructor as EntityConstructor),
    ref: entity.ref,
    name: entity.name,
    authority: entity.authority,
    enabled: entity.enabled,
    transform: serializeTransform(entity.transform),
    behaviors: entity.behaviors.map(createBehaviorDefinition),
    values: createValuesDefinition(entity),
  };
};

export const createFullEntityDefinition = (entity: Entity): EntityDefinitionSchemaType => {
  const definition = createEntityDefinition(entity);
  definition.children = [...entity.children.values()].map(createFullEntityDefinition);
  return definition;
};
