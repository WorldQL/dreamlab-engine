import {
  ConnectionId,
  Entity,
  EntityDescendantSpawned,
  EntityTransformUpdate,
  GameTick,
} from "@dreamlab/engine";
import { ServerNetworkSetupRoutine } from "./net-manager.ts";
import * as internal from "../../../engine/internal.ts";
import { EntityTransformReport } from "@dreamlab/proto/play.ts";

export const handleTransformSync: ServerNetworkSetupRoutine = (net, game) => {
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
      net.broadcast({
        t: "ReportEntityTransforms",
        reports: entityTransformReports,
      });
    }

    transformDirtyEntities.clear();
  });

  function announceAuthority(
    entity: Entity,
    clock: number,
    authority: ConnectionId | undefined,
  ) {
    entity[internal.entityForceAuthorityValues](authority, clock);
    net.broadcast({
      t: "AnnounceExclusiveAuthority",
      entity: entity.ref,
      clock,
      to: authority,
    });
  }

  net.registerPacketHandler("RequestExclusiveAuthority", (from, packet) => {
    const entity = game.entities.lookupByRef(packet.entity);
    if (entity === undefined) return;

    const clock = entity[internal.entityAuthorityClock];

    if (
      packet.clock > clock ||
      (packet.clock === clock && entity.authority !== undefined && from! < entity.authority)
    ) {
      announceAuthority(entity, packet.clock, from);
    }
  });

  net.registerPacketHandler("RelinquishExclusiveAuthority", (from, packet) => {
    const entity = game.entities.lookupByRef(packet.entity);
    if (entity === undefined) return;
    if (entity.authority !== from) return;

    const clock = entity[internal.entityAuthorityClock];
    announceAuthority(entity, clock + 1, undefined);
  });

  net.registerPacketHandler("ReportEntityTransforms", (from, packet) => {
    for (const report of packet.reports) {
      const entity = game.entities.lookupByRef(report.entity);
      if (entity === undefined) return;
      if (entity.authority === undefined || from === entity.authority) {
        ignoredEntityRefs.add(entity.ref);
        entity.transform.position.assign(report.position);
        entity.transform.rotation = report.rotation;
        entity.transform.scale.assign(report.scale);
        ignoredEntityRefs.delete(entity.ref);
      }
    }

    net.broadcast({
      t: "ReportEntityTransforms",
      from,
      reports: packet.reports,
    });
  });
};