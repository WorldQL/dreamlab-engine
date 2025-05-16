import { Transform } from "@dreamlab/engine";
import * as internal from "@dreamlab/engine/internal";
import { convertEntityDefinition } from "@dreamlab/proto/common/entity-sync.ts";
import { ClientNetworkSetupRoutine } from "./net-connection.ts";

export const handleIncomingEntityUpdates: ClientNetworkSetupRoutine = (conn, game) => {
  const inFlightEntities = new Map<string, Promise<void>>();

  conn.registerPacketHandler("SpawnEntities", packet => {
    if (packet.from === game.network.self) return;

    for (const def of packet.definitions) {
      if (inFlightEntities.has(def.ref))
        throw new Error(
          `entity sync: got multiple concurrent SpawnEntities packets for the same ref`,
        );

      const promise = (async () => {
        const parentRef = def.parent;
        await inFlightEntities.get(parentRef);
        const parent = game.entities.lookupByRef(parentRef);
        if (!parent)
          throw new Error(
            `entity sync: tried to spawn underneath a non-existent entity! (${parentRef})`,
          );

        const definition = await convertEntityDefinition(game, def);
        parent[internal.entitySpawn](definition, { from: packet.from ?? "server" });

        // TODO: we want to set value clocks and stuff from a definition as well
      })();

      inFlightEntities.set(def.ref, promise);
      promise.then(() => inFlightEntities.delete(def.ref));
    }
  });

  conn.registerPacketHandler("DeleteEntities", packet => {
    if (packet.from === game.network.self) return;

    for (const ref of packet.entities) {
      const entity = game.entities.lookupByRef(ref);

      if (entity) {
        conn.deleteIgnoreSet.add(entity.ref);
        entity.destroy();
        conn.deleteIgnoreSet.delete(entity.ref);
        continue;
      }

      void (async () => {
        await inFlightEntities.get(ref);
        const entity = game.entities.lookupByRef(ref);
        if (!entity) {
          console.warn(`entity sync: tried to delete non-existent entity (${ref})`);
          return;
        }
        conn.deleteIgnoreSet.add(entity.ref);
        entity.destroy();
        conn.deleteIgnoreSet.delete(entity.ref);
      })();
    }
  });

  conn.registerPacketHandler("ReparentEntities", packet => {
    if (packet.from === game.network.self) return;

    for (let i = 0; i < packet.sources.length && i < packet.targets.length; i++) {
      const sourceRef = packet.sources[i];
      const targetRef = packet.targets[i];

      const source = game.entities.lookupByRef(sourceRef);
      const target = game.entities.lookupByRef(targetRef);

      if (source && target) {
        conn.reparentIgnoreSet.add(source.ref);
        source.parent = target;
        conn.reparentIgnoreSet.delete(source.ref);
        continue;
      }

      void (async () => {
        await Promise.all([inFlightEntities.get(sourceRef), inFlightEntities.get(targetRef)]);

        const source = game.entities.lookupByRef(sourceRef);
        const target = game.entities.lookupByRef(targetRef);

        if (!(source && target)) {
          console.error(
            "entity sync: tried to reparent to or from non-existent entity " +
              `(${sourceRef} [${source?.id}] -> ${targetRef} [${target?.id}])`,
          );
          return;
        }

        conn.reparentIgnoreSet.add(source.ref);
        source.parent = target;
        conn.reparentIgnoreSet.delete(source.ref);
      })();
    }
  });

  conn.registerPacketHandler("RenameEntities", packet => {
    if (packet.from === game.network.self) return;

    for (let i = 0; i < packet.entities.length && i < packet.names.length; i++) {
      const ref = packet.entities[i];
      const name = packet.names[i];

      const entity = game.entities.lookupByRef(ref);
      if (entity) {
        conn.renameIgnoreSet.add(entity.ref);
        entity.name = name;
        conn.renameIgnoreSet.delete(entity.ref);
        continue;
      }

      void (async () => {
        await inFlightEntities.get(ref);
        const entity = game.entities.lookupByRef(ref);
        if (!entity) {
          console.error(`entity sync: tried to rename entity that does not exist (${ref})`);
          return;
        }
        conn.renameIgnoreSet.add(entity.ref);
        entity.name = name;
        conn.renameIgnoreSet.delete(entity.ref);
      })();
    }
  });

  conn.registerPacketHandler("ReportEntityTransforms", packet => {
    if (packet.from === conn.id) return;
    for (const report of packet.reports) {
      const entity = game.entities.lookupByRef(report.entity);
      if (entity === undefined) continue;
      if (entity.authority === conn.id && packet.from !== undefined) continue;

      conn.transformIgnoreSet.add(entity.ref);
      entity[internal.transformFromNetwork](
        packet.from ?? "server",
        new Transform({
          position: report.position,
          rotation: report.rotation,
          scale: report.scale,
          z: report.z,
        }),
        report.teleport ?? false,
      );
      conn.transformIgnoreSet.delete(entity.ref);
    }
  });
};
