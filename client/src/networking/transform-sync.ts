import {
  Entity,
  EntityDescendantSpawned,
  EntityExclusiveAuthorityChanged,
  EntityTransformUpdate,
  GameTick,
} from "@dreamlab/engine";
import { ClientNetworkSetupRoutine } from "./net-connection.ts";
import * as internal from "../../../engine/internal.ts";
import { EntityTransformReport } from "@dreamlab/proto/play.ts";

export const handleTransformSync: ClientNetworkSetupRoutine = (conn, game) => {
  const ignoredEntityRefs = new Set<string>();
  const transformDirtyEntities = new Set<Entity>();

  game.world.on(EntityDescendantSpawned, event => {
    const entity = event.descendant;
    entity.on(EntityTransformUpdate, () => {
      if (!ignoredEntityRefs.has(entity.ref)) {
        transformDirtyEntities.add(entity);
      }
    });
  });

  game.on(GameTick, () => {
    const entityTransformReports: EntityTransformReport[] = [];
    for (const entity of transformDirtyEntities.values()) {
      if (entity.authority !== undefined && entity.authority !== game.network.self) return;

      entityTransformReports.push({
        entity: entity.ref,
        position: entity.transform.position.bare(),
        rotation: entity.transform.rotation,
        scale: entity.transform.scale.bare(),
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
      entity.transform.position.assign(report.position);
      entity.transform.rotation = report.rotation;
      entity.transform.scale.assign(report.scale);
      ignoredEntityRefs.delete(entity.ref);
    }
  });

  conn.registerPacketHandler("AnnounceExclusiveAuthority", packet => {
    const entity = game.entities.lookupByRef(packet.entity);
    if (entity === undefined) return;
    entity[internal.entityForceAuthorityValues](packet.to, packet.clock);
  });

  conn.registerPacketHandler("DenyExclusiveAuthority", packet => {
    const entity = game.entities.lookupByRef(packet.entity);
    if (entity === undefined) return;
    entity[internal.entityForceAuthorityValues](packet.current_authority, packet.clock);
  });
};
