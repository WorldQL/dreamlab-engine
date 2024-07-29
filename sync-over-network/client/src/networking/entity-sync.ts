import {
  Entity,
  EntityDescendantDestroyed,
  EntityDescendantReparented,
  EntityDescendantSpawned,
  GameStatus,
} from "@dreamlab/engine";
import * as internal from "../../../../engine/internal.ts";
import { ClientNetworkSetupRoutine } from "./net-connection.ts";

import {
  convertEntityDefinition,
  getAllEntityRefs,
  serializeEntityDefinition,
} from "@dreamlab/proto/common/entity-sync.ts";
import { ReceivedInitialNetworkSnapshot } from "@dreamlab/proto/common/signals.ts";

export const handleEntitySync: ClientNetworkSetupRoutine = (conn, game) => {
  let changeIgnoreSet = new Set<string>();

  game.world.on(EntityDescendantSpawned, async event => {
    if (game.status !== GameStatus.Running) return;

    const entity = event.descendant;
    if (changeIgnoreSet.has(entity.ref)) return;

    const definition = await serializeEntityDefinition(
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
    conn.send({ t: "DeleteEntity", entity: entity.ref });
  });

  conn.registerPacketHandler("InitialNetworkSnapshot", async packet => {
    const entityPromises: Promise<Entity>[] = [];
    let allRefs = new Set<string>();

    for (const { root, defs } of [
      { root: game.world, defs: packet.worldEntities },
      { root: game.prefabs, defs: packet.prefabEntities },
    ]) {
      for (const def of defs) {
        entityPromises.push(
          (async () => {
            const definition = await convertEntityDefinition(game, def);
            const refs = getAllEntityRefs(definition);
            allRefs = allRefs.union(refs);

            changeIgnoreSet = changeIgnoreSet.union(refs);
            const entity = root[internal.entitySpawn](definition, { inert: true });
            changeIgnoreSet = changeIgnoreSet.difference(refs);
            return entity;
          })(),
        );
      }
    }

    const entities = await Promise.all(entityPromises);

    changeIgnoreSet = changeIgnoreSet.union(allRefs);
    for (const entity of entities) entity[internal.entitySpawnFinalize]();
    changeIgnoreSet = changeIgnoreSet.difference(allRefs);

    game.fire(ReceivedInitialNetworkSnapshot);
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
};
