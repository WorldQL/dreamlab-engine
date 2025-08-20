import {
  Entity,
  EntityDescendantSpawned,
  EntityExclusiveAuthorityChanged,
  EntityTransformUpdate,
  InternalGameTick,
  Transform,
} from "@dreamlab/engine";
import * as internal from "@dreamlab/engine/internal";
import { PlayPacket } from "@dreamlab/proto/play.ts";
import { Simplify } from "@dreamlab/vendor/type-fest.ts";
import { ClientNetworkSetupRoutine } from "./net-connection.ts";

export const handleTransformSync: ClientNetworkSetupRoutine = (conn, game) => {
  const ignoredEntityRefs = new Set<string>();
  const transformDirtyEntities = new Set<Entity>();

  game.world.on(EntityDescendantSpawned, event => {
    const entity = event.descendant;
    entity.on(EntityTransformUpdate, event => {
      if (event.source !== entity) return;
      if (event.fromNetwork !== undefined) return;

      if (!ignoredEntityRefs.has(event.source.ref)) {
        transformDirtyEntities.add(entity);
      }
    });
  });

  type EntityTransformReports = Simplify<
    Omit<PlayPacket<"ReportEntityTransforms", "client">, "t">
  >;

  const entityTransformReports: EntityTransformReports = {
    entities: [],
    positions: [],
    rotations: [],
    scales: [],
    zs: [],
    teleports: [],
    parents: [],
  };

  game.on(InternalGameTick, () => {
    for (const entity of transformDirtyEntities.values()) {
      if (entity.name.includes(".NoNetTransform")) {
        continue;
      }

      if (entity.authority !== undefined && entity.authority !== game.network.self) continue;

      entityTransformReports.entities.push(entity.ref);
      entityTransformReports.positions.push(entity.transform.position.bare());
      entityTransformReports.rotations.push(entity.transform.rotation);
      entityTransformReports.scales.push(entity.transform.scale.bare());
      entityTransformReports.zs.push(entity.transform.z);
      entityTransformReports.teleports.push(entity[internal.entityTeleportingThisTick]);
      entityTransformReports.parents.push(entity.parent?.ref);
    }

    if (entityTransformReports.entities.length > 0) {
      conn.send({
        t: "ReportEntityTransforms",
        ...entityTransformReports,
      });

      // clear arrays
      entityTransformReports.entities.length = 0;
      entityTransformReports.positions.length = 0;
      entityTransformReports.rotations.length = 0;
      entityTransformReports.scales.length = 0;
      entityTransformReports.zs.length = 0;
      entityTransformReports.teleports.length = 0;
      entityTransformReports.parents.length = 0;
    }

    transformDirtyEntities.clear();
  });

  game.on(EntityExclusiveAuthorityChanged, event => {
    const entity = event.entity;
    if (event.authority === conn.id) {
      conn.send({
        t: "RequestExclusiveAuthority",
        entity: entity.ref,
        clock: event.clock,
      });
    } else if (entity.authority === conn.id) {
      conn.send({
        t: "RelinquishExclusiveAuthority",
        entity: entity.ref,
      });
    }
  });

  conn.registerPacketHandler("ReportEntityTransforms", packet => {
    if (packet.from === conn.id) return;
    for (let i = 0; i < packet.entities.length; i++) {
      const entity = game.entities.lookupByRef(packet.entities[i]);
      if (entity === undefined) continue;
      if (entity.authority === conn.id && packet.from !== undefined) continue;

      ignoredEntityRefs.add(entity.ref);
      entity[internal.transformFromNetwork](
        packet.from ?? "server",
        new Transform({
          position: packet.positions[i],
          rotation: packet.rotations[i],
          scale: packet.scales[i],
          z: packet.zs[i],
        }),
        packet.teleports[i],
      );
      ignoredEntityRefs.delete(entity.ref);
    }
  });

  conn.registerPacketHandler("AnnounceExclusiveAuthority", packet => {
    const entity = game.entities.lookupByRef(packet.entity);
    if (entity === undefined) return;

    const applyAuthority = (e: Entity) => {
      e[internal.entityForceAuthorityValues](packet.to, packet.clock);
      for (const child of e.children.values()) applyAuthority(child);
    };
    applyAuthority(entity);
  });

  conn.registerPacketHandler("DenyExclusiveAuthority", packet => {
    const entity = game.entities.lookupByRef(packet.entity);
    if (entity === undefined) return;
    entity[internal.entityForceAuthorityValues](packet.current_authority, packet.clock);
  });
};
