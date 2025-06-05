import { Entity, Transform } from "@dreamlab/engine";
import * as internal from "@dreamlab/engine/internal";
import { convertEntityDefinition } from "@dreamlab/proto/common/entity-sync.ts";
import { ServerNetworkSetupRoutine } from "./net-manager.ts";

export const handleIncomingEntityUpdates: ServerNetworkSetupRoutine = (net, game) => {
  const inFlightEntities = new Map<string, Promise<void>>();

  net.registerPacketHandler("SpawnEntities", (from, packet) => {
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
        parent[internal.entitySpawn](definition, { from });
      })();

      inFlightEntities.set(def.ref, promise);
      promise.then(() => inFlightEntities.delete(def.ref));
    }

    net.broadcast({ ...packet, from });
  });

  net.registerPacketHandler("DeleteEntities", (from, packet) => {
    for (const ref of packet.entities) {
      const entity = game.entities.lookupByRef(ref);

      if (entity) {
        net.deleteIgnoreSet.add(entity.ref);
        entity.destroy();
        net.deleteIgnoreSet.delete(entity.ref);
        continue;
      }

      void (async () => {
        await inFlightEntities.get(ref);
        const entity = game.entities.lookupByRef(ref);
        if (!entity) {
          console.warn(`entity sync: tried to delete non-existent entity (${ref})`);
          return;
        }
        net.deleteIgnoreSet.add(entity.ref);
        entity.destroy();
        net.deleteIgnoreSet.delete(entity.ref);
      })();
    }

    net.broadcast({ ...packet, from });
  });

  net.registerPacketHandler("ReparentEntities", (from, packet) => {
    for (let i = 0; i < packet.sources.length && i < packet.targets.length; i++) {
      const sourceRef = packet.sources[i];
      const targetRef = packet.targets[i];

      const source = game.entities.lookupByRef(sourceRef);
      const target = game.entities.lookupByRef(targetRef);

      if (source && target) {
        net.reparentIgnoreSet.add(source.ref);
        source.parent = target;
        net.reparentIgnoreSet.delete(source.ref);
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

        net.reparentIgnoreSet.add(source.ref);
        source.parent = target;
        net.reparentIgnoreSet.delete(source.ref);
      })();
    }

    net.broadcast({ ...packet, from });
  });

  net.registerPacketHandler("RenameEntities", (from, packet) => {
    for (let i = 0; i < packet.entities.length && i < packet.names.length; i++) {
      const ref = packet.entities[i];
      const name = packet.names[i];

      const entity = game.entities.lookupByRef(ref);
      if (entity) {
        net.renameIgnoreSet.add(entity.ref);
        entity.name = name;
        net.renameIgnoreSet.delete(entity.ref);
        continue;
      }

      void (async () => {
        await inFlightEntities.get(ref);
        const entity = game.entities.lookupByRef(ref);
        if (!entity) {
          console.error(`entity sync: tried to rename entity that does not exist (${ref})`);
          return;
        }
        net.renameIgnoreSet.add(entity.ref);
        entity.name = name;
        net.renameIgnoreSet.delete(entity.ref);
      })();
    }

    net.broadcast({ ...packet, from });
  });

  net.registerPacketHandler("ReportEntityTransforms", (from, packet) => {
    for (const report of packet.reports) {
      const entity = game.entities.lookupByRef(report.entity);
      if (!entity) continue;
      if (entity.authority !== undefined && entity.authority !== from) continue;

      net.transformIgnoreSet.add(entity.ref);
      entity[internal.transformFromNetwork](
        from,
        new Transform({
          position: report.position,
          rotation: report.rotation,
          scale: report.scale,
          z: report.z,
        }),
        report.teleport ?? false,
      );
      net.transformIgnoreSet.delete(entity.ref);
    }

    net.broadcast({ ...packet, from });
  });

  net.registerPacketHandler("RequestExclusiveAuthority", (from, packet) => {
    const entity = game.entities.lookupByRef(packet.entity);
    if (!entity) return;
    const currentClock = entity[internal.entityAuthorityClock];

    if (
      packet.clock > currentClock ||
      (packet.clock === currentClock &&
        (entity.authority === undefined || from < entity.authority))
    ) {
      const applyAuthority = (e: Entity) => {
        e[internal.entityForceAuthorityValues](from, packet.clock);
        for (const child of e.children.values()) applyAuthority(child);
      };
      applyAuthority(entity);

      net.broadcast({
        t: "AnnounceExclusiveAuthority",
        entity: entity.ref,
        clock: packet.clock,
        to: from,
      });
    } else {
      net.send(from, {
        t: "DenyExclusiveAuthority",
        entity: entity.ref,
        clock: currentClock,
        current_authority: entity.authority,
      });
    }
  });

  net.registerPacketHandler("RelinquishExclusiveAuthority", (from, packet) => {
    const entity = game.entities.lookupByRef(packet.entity);
    if (!entity) return;
    if (entity.authority !== from) return;

    const applyAuthority = (e: Entity) => {
      e[internal.entityForceAuthorityValues](undefined, e[internal.entityAuthorityClock] + 1);
      for (const child of e.children.values()) applyAuthority(child);
    };
    applyAuthority(entity);

    net.broadcast({
      t: "AnnounceExclusiveAuthority",
      entity: entity.ref,
      clock: entity[internal.entityAuthorityClock],
      to: undefined,
    });
  });
};
