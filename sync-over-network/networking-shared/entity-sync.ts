import { BehaviorDefinition, Entity, EntityDefinition, Game } from "@dreamlab/engine";
import * as internal from "../../engine/internal.ts";
import { BehaviorDefinitionSchema, EntityDefinitionSchema } from "@dreamlab/proto/datamodel.ts";
import type { z } from "@dreamlab/vendor/zod.ts";

export const convertBehaviorDefinition = async (
  game: Game,
  def: z.infer<typeof BehaviorDefinitionSchema>,
): Promise<BehaviorDefinition> => {
  const type = await game[internal.behaviorLoader].loadScript(def.script);
  return {
    type,
    values: def.values,
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
    values: def.values,
    transform: def.transform,
    authority: def.authority,
    behaviors,
    children,
  };
};

export const serializeBehaviorDefinition = async (
  game: Game,
  def: BehaviorDefinition,
): Promise<z.infer<typeof BehaviorDefinitionSchema>> => {
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
  };
};

export const serializeEntityDefinition = async (
  game: Game,
  def: EntityDefinition,
  parentRef: string,
): Promise<z.infer<typeof EntityDefinitionSchema>> => {
  const ref = def._ref;
  if (ref === undefined)
    throw new Error("Attempted to serialize EntityDefinition with undefined ref");

  const children = def.children
    ? await Promise.all(
        [...def.children.values()].map(child => serializeEntityDefinition(game, child, ref)),
      )
    : undefined;

  const behaviors = def.behaviors
    ? await Promise.all(
        def.behaviors.map(behavior => serializeBehaviorDefinition(game, behavior)),
      )
    : undefined;

  return {
    type: Entity.getTypeName(def.type),
    name: def.name,
    values: def.values,
    transform: def.transform,
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
