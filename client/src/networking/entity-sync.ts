import {
  Entity,
  EntityDescendantDestroyed,
  EntityDescendantRenamed,
  EntityDescendantReparented,
  EntityDescendantSpawned,
  GameStatus,
  GameStatusChange,
} from "@dreamlab/engine";
import * as internal from "@dreamlab/engine/internal";
import { ClientNetworkSetupRoutine } from "./net-connection.ts";

import {
  convertEntityDefinition,
  getAllEntityRefs,
  serializeEntityDefinition,
} from "@dreamlab/proto/common/entity-sync.ts";
import { ReceivedInitialNetworkSnapshot } from "@dreamlab/proto/common/signals.ts";

export const handleEntitySync: ClientNetworkSetupRoutine = (conn, game) => {
  let changeIgnoreSet = new Set<string>();
  let initialNetSpawnedEntityRefs = new Set<string>();
  let initialNetSpawnedEntities: Entity[] = [];

  game.world.on(EntityDescendantSpawned, event => {
    if (game.status !== GameStatus.Running) return;

    const entity = event.descendant;
    if (changeIgnoreSet.has(entity.ref)) return;

    const definition = serializeEntityDefinition(
      game,
      entity.getDefinition(),
      entity.parent!.ref,
    );

    conn.send({
      t: "SpawnEntity",
      definition,
    });
  });

  game.world.on(EntityDescendantDestroyed, event => {
    if (game.status !== GameStatus.Running) return;

    const entity = event.descendant;
    if (changeIgnoreSet.has(entity.ref)) return;
    if (event.parentDestroyed) return;

    conn.send({ t: "DeleteEntity", entity: entity.ref });
  });

  conn.registerPacketHandler("InitialNetworkSnapshot", async packet => {
    const entityPromises: Promise<Entity>[] = [];
    initialNetSpawnedEntityRefs = new Set<string>();

    for (const { root, defs } of [
      { root: game.world, defs: packet.worldEntities },
      { root: game.prefabs, defs: packet.prefabEntities },
    ]) {
      for (const def of defs) {
        entityPromises.push(
          (async () => {
            const definition = await convertEntityDefinition(game, def);
            const refs = getAllEntityRefs(definition);
            initialNetSpawnedEntityRefs = initialNetSpawnedEntityRefs.union(refs);

            changeIgnoreSet = changeIgnoreSet.union(refs);
            const entity = root[internal.entitySpawn](definition, { inert: true });
            changeIgnoreSet = changeIgnoreSet.difference(refs);
            return entity;
          })(),
        );
      }
    }

    initialNetSpawnedEntities = await Promise.all(entityPromises);
    game.fire(ReceivedInitialNetworkSnapshot);
  });

  const statusListener = game.on(GameStatusChange, () => {
    if (game.status === GameStatus.Running) {
      statusListener.unsubscribe();

      changeIgnoreSet = changeIgnoreSet.union(initialNetSpawnedEntityRefs);
      console.log(initialNetSpawnedEntities);
      for (const entity of initialNetSpawnedEntities) entity[internal.entitySpawnFinalize]();
      changeIgnoreSet = changeIgnoreSet.difference(initialNetSpawnedEntityRefs);

      initialNetSpawnedEntities = [];
      initialNetSpawnedEntityRefs.clear();
    }
  });

  conn.registerPacketHandler("SpawnEntity", async packet => {
    if (packet.from === conn.id) return;
    const def = packet.definition;

    const parent = game.entities.lookupByRef(def.parent);
    if (!parent) {
      throw new Error(
        `entity sync: Tried to spawn underneath a non-existent entity! (${def.parent})`,
      );
    }

    const definition = await convertEntityDefinition(game, def);
    const refs = getAllEntityRefs(definition);
    changeIgnoreSet = changeIgnoreSet.union(refs);
    parent.spawn(definition);
    changeIgnoreSet = changeIgnoreSet.difference(refs);
  });

  conn.registerPacketHandler("DeleteEntity", packet => {
    if (packet.from === conn.id) return;
    const entity = game.entities.lookupByRef(packet.entity);
    if (!entity) {
      throw new Error(`entity sync: Tried to delete a non-existent entity! (${packet.entity})`);
    }

    changeIgnoreSet.add(entity.ref);
    entity.destroy();
    changeIgnoreSet.delete(entity.ref);
  });

  game.world.on(EntityDescendantReparented, event => {
    console.log(event);

    if (game.status !== GameStatus.Running) return;

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
    if (packet.from === conn.id) return;

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

  game.world.on(EntityDescendantRenamed, event => {
    const entity = event.descendant;
    if (changeIgnoreSet.has(entity.ref)) return;

    conn.send({
      t: "RenameEntity",
      entity: entity.ref,
      name: entity.name,
      old_name: event.oldName,
    });
  });

  conn.registerPacketHandler("RenameEntity", packet => {
    if (packet.from === conn.id) return;

    const entity = game.entities.lookupByRef(packet.entity);
    if (!entity)
      throw new Error(`entity sync: Tried to rename a non-existent entity! (${packet.entity})`);

    changeIgnoreSet.add(entity.ref);
    entity.name = packet.name;
    changeIgnoreSet.delete(entity.ref);
  });
};
