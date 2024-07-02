import {
  EntityDescendantDestroyed,
  EntityDescendantReparented,
  EntityDescendantSpawned,
} from "@dreamlab/engine";
import { ClientNetworkSetupRoutine } from "./net-connection.ts";

import { convertEntityDefinition, serializeEntityDefinition } from "../common/entity-sync.ts";
import { PlayPacket } from "@dreamlab/proto/play.ts";

export const handleEntitySync: ClientNetworkSetupRoutine = (conn, game) => {
  const changeIgnoreSet = new Set<string>();

  game.world.on(EntityDescendantSpawned, async event => {
    const entity = event.descendant;
    if (changeIgnoreSet.has(entity.ref)) return;

    const packet: PlayPacket<"SpawnEntity", "client"> = {
      t: "SpawnEntity",
      definition: await serializeEntityDefinition(
        game,
        entity.getDefinition(),
        entity.parent!.ref,
      ),
    };
    // TODO: send spawn entity packet (needs definition conversion)
  });

  game.world.on(EntityDescendantDestroyed, event => {
    const entity = event.descendant;
    if (changeIgnoreSet.has(entity.ref)) return;
    conn.send({ t: "DeleteEntity", entity: entity.ref });
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
