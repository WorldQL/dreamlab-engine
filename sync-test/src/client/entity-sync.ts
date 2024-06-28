import {
  BehaviorDefinition,
  Entity,
  EntityDefinition,
  EntityDescendantDestroyed,
  EntityDescendantReparented,
  EntityDescendantSpawned,
  EntityReparented,
  Game,
} from "@dreamlab/engine";
import * as internal from "../../../engine/internal.ts";
import { ClientNetworkSetupRoutine } from "./net-connection.ts";
import { BehaviorSchema, EntityDefinitionSchema } from "@dreamlab/proto/datamodel.ts";
import type { z } from "@dreamlab/vendor/zod.ts";

const convertBehaviorDefinition = async (
  game: Game,
  def: z.infer<typeof BehaviorSchema>,
): Promise<BehaviorDefinition> => {
  const type = await game[internal.behaviorScriptLoader].loadScript(def.script);
  return {
    type,
    values: def.values,
  };
};

const convertEntityDefinition = async (
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
    type: Entity.getEntityType(def.type),
    name: def.name,
    values: def.values,
    behaviors,
    children,
  };
};

export const handleEntitySync: ClientNetworkSetupRoutine = (conn, game) => {
  const changeIgnoreSet = new Set<string>();

  game.world.on(EntityDescendantSpawned, event => {
    const entity = event.descendant;
    if (changeIgnoreSet.has(entity.ref)) return;

    // TODO: send spawn entity packet (needs definition conversion)
  });

  game.world.on(EntityDescendantDestroyed, event => {});

  conn.registerPacketHandler("SpawnEntity", async packet => {
    if (packet.originator === conn.id) return;
    const def = packet.definition;

    const parent = game.entities.lookupByRef(def.parent);
    if (!parent) {
      throw new Error(
        `entity sync: Tried to spawn underneath a non-existent entity! (${def.parent})`,
      );
    }

    const definition = await convertEntityDefinition(game, def);
    changeIgnoreSet.add(def.ref);
    parent.spawn(definition);
    changeIgnoreSet.delete(def.ref);
  });

  game.world.on(EntityDescendantReparented, event => {
    const entity = event.descendant;
    if (changeIgnoreSet.has(entity.ref)) return;
    if (entity.parent === undefined) return;

    conn.send({
      t: "ReparentEntity",
      entity: entity.ref,
      old_parent: event.oldParent.ref,
      parent: entity.parent.ref,
    });
  });

  conn.registerPacketHandler("ReparentEntity", packet => {
    if (packet.originator === conn.id) return;

    const entity = game.entities.lookupByRef(packet.entity);
    if (!entity)
      throw new Error(
        `entity sync: Tried to reparent a non-existent entity! (${packet.entity})`,
      );

    const parent = game.entities.lookupByRef(packet.parent);
    if (!parent)
      throw new Error(
        `entity sync: Tried to reparent to a non-existent entity (${packet.entity} -> ${packet.parent})`,
      );

    changeIgnoreSet.add(packet.entity);
    entity.parent = parent;
    changeIgnoreSet.delete(packet.entity);
  });
};
