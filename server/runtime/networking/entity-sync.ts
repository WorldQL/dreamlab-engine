import {
  EntityDescendantDestroyed,
  EntityDescendantReparented,
  EntityDescendantSpawned,
  GameStatus,
} from "@dreamlab/engine";
import { ServerNetworkSetupRoutine } from "./net-manager.ts";
import {
  convertEntityDefinition,
  serializeEntityDefinition,
} from "../../networking-shared/entity-sync.ts";
import { PeerConnected } from "../../networking-shared/signals.ts";

export const handleEntitySync: ServerNetworkSetupRoutine = (net, game) => {
  const changeIgnoreSet = new Set<string>();

  game.world.on(EntityDescendantSpawned, async event => {
    if (game.status !== GameStatus.Running) return;

    const entity = event.descendant;
    if (changeIgnoreSet.has(entity.ref)) return;

    const definition = await serializeEntityDefinition(
      game,
      entity.getDefinition(),
      entity.parent!.ref,
    );

    net.broadcast({
      t: "SpawnEntity",
      definition,
    });
  });

  game.world.on(EntityDescendantDestroyed, event => {
    if (game.status !== GameStatus.Running) return;

    const entity = event.descendant;
    if (changeIgnoreSet.has(entity.ref)) return;
    net.broadcast({ t: "DeleteEntity", entity: entity.ref });
  });

  game.on(PeerConnected, async ({ peer }) => {
    const worldEntities = [];
    for (const child of game.world.children.values()) {
      worldEntities.push(
        serializeEntityDefinition(game, child.getDefinition(), game.world.ref),
      );
    }

    const prefabEntities = [];
    for (const child of game.prefabs.children.values()) {
      prefabEntities.push(
        serializeEntityDefinition(game, child.getDefinition(), game.prefabs.ref),
      );
    }

    net.send(peer.connectionId, {
      t: "InitialNetworkSnapshot",
      worldEntities: await Promise.all(worldEntities),
      prefabEntities: await Promise.all(prefabEntities),
    });
  });

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
};
