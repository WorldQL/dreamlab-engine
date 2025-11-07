import {
  BehaviorDefinition,
  Entity,
  EntityDefinition,
  Game,
  JsonValue,
  TransformOptions,
} from "@dreamlab/engine";
import * as internal from "@dreamlab/engine/internal";
import type * as z from "@dreamlab/vendor/zod.ts";
import {
  BehaviorDefinitionSchema,
  EntityDefinitionSchema,
  TransformSchema,
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
    sync: def.sync,
    transform: def.transform,
    authority: def.authority,
    behaviors,
    children,
    data: def.data as JsonValue,
  };
};

export const serializeTransform = (
  transform: TransformOptions,
): z.infer<typeof TransformSchema> => {
  const txfm = {
    position: transform.position
      ? { x: transform.position.x ?? 0, y: transform.position.y ?? 0 }
      : undefined,
    rotation: transform.rotation,
    scale: transform.scale
      ? { x: transform.scale.x ?? 1, y: transform.scale.y ?? 1 }
      : undefined,
    z: transform.z,
  };

  if (txfm.position?.x === 0 && txfm.position?.y === 0) delete txfm.position;
  if (txfm?.rotation === 0) delete txfm.rotation;
  if (txfm.scale?.x === 1 && txfm.scale?.y === 1) delete txfm.scale;
  if (txfm?.z === 0) delete txfm.z;

  // @ts-expect-error: this works cba to fix the type
  return txfm;
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
    // @ts-expect-error generic cast
    sync: def.sync ?? {},
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

  const desc: z.infer<typeof EntityDefinitionSchema> = {
    type: Entity.getTypeName(def.type),
    name: def.name,
    enabled: def.enabled,
    values: def.values,
    // @ts-expect-error generic cast
    sync: def.sync,
    transform: def.transform ? serializeTransform(def.transform) : undefined,
    authority: def.authority,
    behaviors,
    children,
    ref,
    parent: parentRef,
    data: def.data,
  };

  if (desc.enabled === true) delete desc.enabled;
  if (desc.values && Object.keys(desc.values).length === 0) delete desc.values;
  if (desc.sync && Object.keys(desc.sync).length === 0) delete desc.sync;
  if (desc.transform && Object.keys(desc.transform).length === 0) delete desc.transform;
  if (desc.children && desc.children.length === 0) delete desc.children;
  if (desc.data === undefined) delete desc.data;

  return desc;
};

export const getAllEntityRefs = (def: EntityDefinition, refs?: Set<string>): Set<string> => {
  const refSet = refs ?? new Set<string>();
  if (def._ref) refSet.add(def._ref);
  def.children?.forEach(c => getAllEntityRefs(c, refSet));
  return refSet;
};
