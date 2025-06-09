import {
  Behavior,
  BehaviorConstructor,
  BehaviorDefinition,
  ConnectionId,
  Entity,
  EntityConstructor,
  EntityDefinition,
  Game,
  TransformOptions,
  ValueDescription,
} from "@dreamlab/engine";
import * as internal from "@dreamlab/engine/internal";
import type { z } from "@dreamlab/vendor/zod.ts";
import {
  BehaviorDefinitionSchema,
  BehaviorDefinitionSchemaType,
  EntityDefinitionSchema,
  EntityDefinitionSchemaType,
  TransformSchemaType,
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

const netSpawnEntityInertSingle = (
  parent: Entity,
  from: ConnectionId,
  def: EntityDefinitionSchemaType,
  convertedBehaviors: BehaviorDefinition[],
): Entity => {
  const entity = parent[internal.entitySpawn](
    {
      _ref: def.ref,
      type: Entity.getEntityType(def.type),
      name: def.name,
      enabled: def.enabled,
      _richValues: def.values as Record<string, ValueDescription>,
      transform: def.transform,
      authority: def.authority,
    },
    { inert: true, from },
  );

  for (const b of convertedBehaviors) {
    entity.behaviors.push(
      new b.type({
        game: entity.game,
        entity,
        ref: b._ref,
        sync: b.sync,
        // TODO: convert values
        values: b.values,
      }),
    );
    // no need to run implicitSetup or setup() because we're inert here
  }

  return entity;
};

export const netSpawnEntityInert = async (
  game: Game,
  from: ConnectionId,
  def: EntityDefinitionSchemaType,
): Promise<Entity[]> => {
  // TODO: apply authority clock

  const inner = async (def: EntityDefinitionSchemaType, parent: Entity): Promise<Entity[]> => {
    const behaviors = await Promise.all(
      def.behaviors?.map(b => convertBehaviorDefinition(game, b)) ?? [],
    );
    const entity = netSpawnEntityInertSingle(parent, from, def, behaviors);

    const entities = [entity];
    for (const child of def.children ?? []) {
      const childEntities = await inner(child, entity);
      entities.push(...childEntities);
    }

    return entities;
  };

  const parent = game.entities.lookupByRef(def.parent);
  if (!parent)
    throw new Error("entity sync: tried to spawn entity underneath non-existent parent");

  const entities = await inner(def, parent);

  return entities;
};

export const serializeTransform = (transform: TransformOptions): TransformSchemaType => {
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
