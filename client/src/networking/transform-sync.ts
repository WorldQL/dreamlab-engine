import {
  Entity,
  EntityDescendantSpawned,
  EntityExclusiveAuthorityChanged,
  EntityTransformUpdate,
  GameTick,
  Transform,
} from "@dreamlab/engine";
import * as internal from "@dreamlab/engine/internal";
import { EntityTransformReport } from "@dreamlab/proto/play.ts";
import { ClientNetworkSetupRoutine } from "./net-connection.ts";

export const handleTransformSync: ClientNetworkSetupRoutine = (conn, game) => {
  const ignoredEntityRefs = new Set<string>();
  const transformDirtyEntities = new Set<Entity>();

  game.world.on(EntityDescendantSpawned, event => {
    const entity = event.descendant;
    entity.on(EntityTransformUpdate, ({ source }) => {
      if (!ignoredEntityRefs.has(source.ref)) {
        transformDirtyEntities.add(entity);
      }
    });
  });

  game.on(GameTick, () => {
    const entityTransformReports: EntityTransformReport[] = [];
    for (const entity of transformDirtyEntities.values()) {
      if (entity.authority !== undefined && entity.authority !== game.network.self) continue;

      entityTransformReports.push({
        entity: entity.ref,
        position: entity.transform.position.bare(),
        rotation: entity.transform.rotation,
        scale: entity.transform.scale.bare(),
        z: entity.transform.z,
      });
    }

    if (entityTransformReports.length > 0) {
      conn.send({
        t: "ReportEntityTransforms",
        reports: entityTransformReports,
      });
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

    for (const report of packet.reports) {
      const entity = game.entities.lookupByRef(report.entity);
      if (entity === undefined) continue;
      if (entity.authority === conn.id) continue;

      ignoredEntityRefs.add(entity.ref);
      entity.transform[internal.transformForceUpdate](
        new Transform({
          position: report.position,
          rotation: report.rotation,
          scale: report.scale,
          z: report.z,
        }),
      );
      entity.transform[internal.transformOnChanged]();
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
