import {
  ConnectionId,
  EntityDescendantDestroyed,
  EntityDescendantReparented,
  EntityDescendantSpawned,
  GameStatus,
} from "@dreamlab/engine";
import { ServerNetworkSetupRoutine } from "./net-manager.ts";
import {
  convertEntityDefinition,
  serializeEntityDefinition,
} from "@dreamlab/proto/common/entity-sync.ts";
import { PlayPacket } from "@dreamlab/proto/play.ts";

export const handleEntitySync: ServerNetworkSetupRoutine = (net, game) => {
  const changeIgnoreSet = new Set<string>();

  const syncSpawnEvent = (event: EntityDescendantSpawned) => {
    if (game.status !== GameStatus.Running) return;

    const entity = event.descendant;
    if (changeIgnoreSet.has(entity.ref)) return;

    const definition = serializeEntityDefinition(
      game,
      entity.getDefinition(),
      entity.parent!.ref,
    );

    net.broadcast({
      t: "SpawnEntity",
      definition,
    });
  };

  const syncDestroyEvent = (event: EntityDescendantDestroyed) => {
    if (game.status !== GameStatus.Running) return;

    const entity = event.descendant;
    if (changeIgnoreSet.has(entity.ref)) return;
    net.broadcast({ t: "DeleteEntity", entity: entity.ref });
  };

  game.world.on(EntityDescendantSpawned, syncSpawnEvent);
  game.prefabs.on(EntityDescendantSpawned, syncSpawnEvent);

  game.world.on(EntityDescendantDestroyed, syncDestroyEvent);
  game.prefabs.on(EntityDescendantDestroyed, syncDestroyEvent);

  net.registerPacketHandler("SpawnEntity", async (from, packet) => {
    const def = packet.definition;

    const parent = game.entities.lookupByRef(def.parent);
    if (!parent) {
      throw new Error(
        `entity sync: Tried to spawn underneath a non-existent entity! (${def.parent})`,
      );
    }

    // ensure authority can only be delegated to self or server
    const rewriteAuthority = (def: typeof packet.definition) => {
      if (def.authority !== from) def.authority = undefined;
      if (def.children) for (const child of def.children) rewriteAuthority(child);
    };
    rewriteAuthority(def);

    const definition = await convertEntityDefinition(game, def);

    changeIgnoreSet.add(def.ref);
    parent.spawn(definition);
    changeIgnoreSet.delete(def.ref);

    net.broadcast({ t: "SpawnEntity", definition: packet.definition, from });
  });

  net.registerPacketHandler("DeleteEntity", (from, packet) => {
    const entity = game.entities.lookupByRef(packet.entity);
    if (!entity) {
      throw new Error(`entity sync: Tried to delete a non-existent entity! (${packet.entity})`);
    }

    changeIgnoreSet.add(entity.ref);
    entity.destroy();
    changeIgnoreSet.delete(entity.ref);

    net.broadcast({ t: "DeleteEntity", entity: packet.entity, from });
  });

  game.world.on(EntityDescendantReparented, event => {
    if (game.status !== GameStatus.Running) return;

    const entity = event.descendant;
    if (changeIgnoreSet.has(entity.ref)) return;
    if (entity.parent === undefined) return;

    net.broadcast({
      t: "ReparentEntity",
      entity: entity.ref,
      parent: entity.parent.ref,
    });
  });

  net.registerPacketHandler("ReparentEntity", (from, packet) => {
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

    if (entity.parent?.ref !== packet.old_parent) return;

    changeIgnoreSet.add(entity.ref);
    entity.parent = parent;
    changeIgnoreSet.delete(entity.ref);

    net.broadcast({
      t: "ReparentEntity",
      from: from,
      entity: packet.entity,
      parent: packet.parent,
    });
  });

  net.registerPacketHandler("RenameEntity", (from, packet) => {
    const entity = game.entities.lookupByRef(packet.entity);
    if (!entity)
      throw new Error(`entity sync: Tried to rename a non-existent entity! (${packet.entity})`);

    if (packet.old_name !== entity.name) return;

    changeIgnoreSet.add(entity.ref);
    entity.name = packet.name;
    changeIgnoreSet.delete(entity.ref);

    net.broadcast({
      t: "RenameEntity",
      from,
      entity: packet.entity,
      name: entity.name,
    });
  });
};
