import {
  ConnectionId,
  Entity,
  EntityDescendantSpawned,
  EntityTransformUpdate,
  GameTick,
  IVector2,
  Transform,
} from "@dreamlab/engine";
import * as internal from "@dreamlab/engine/internal";
import { EntityTransformReport } from "@dreamlab/proto/play.ts";
import { ServerNetworkSetupRoutine } from "./net-manager.ts";

export const handleTransformSync: ServerNetworkSetupRoutine = (net, game) => {
  const ignoredEntityRefs = new Set<string>();
  const transformDirtyEntities = new Set<Entity>();

  interface ITransform {
    position: IVector2;
    rotation: number;
    scale: IVector2;
    z: number;
  }
  const lastTransforms = new WeakMap<Entity, ITransform>();

  const transformFor = (entity: Entity): ITransform => ({
    position: entity.globalTransform.position.bare(),
    rotation: entity.globalTransform.rotation,
    scale: entity.globalTransform.scale.bare(),
    z: entity.globalTransform.z,
  });

  const transformsEq = (a: ITransform, b: ITransform) =>
    a.position.x === b.position.x &&
    a.position.y === b.position.y &&
    a.rotation === b.rotation &&
    a.scale.x === b.scale.x &&
    a.scale.y === b.scale.y &&
    a.z === b.z;

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

      const currTransform = transformFor(entity);
      const lastTransform = lastTransforms.get(entity);
      if (!lastTransform || !transformsEq(lastTransform, currTransform)) {
        lastTransforms.set(entity, currTransform);

        entityTransformReports.push({
          entity: entity.ref,
          position: entity.transform.position.bare(),
          rotation: entity.transform.rotation,
          scale: entity.transform.scale.bare(),
        });
      }
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
    const applyAuthority = (e: Entity) => {
      e[internal.entityForceAuthorityValues](authority, clock);
      for (const child of e.children.values()) applyAuthority(child);
    };
    applyAuthority(entity);

    net.broadcast({
      t: "AnnounceExclusiveAuthority",
      entity: entity.ref,
      clock,
      to: authority,
    });
  }

  net.registerPacketHandler("RequestExclusiveAuthority", (from, packet) => {
    const entity = game.entities.lookupByRef(packet.entity);
    if (entity === undefined) {
      throw new Error("no such entity " + packet.entity);
    }

    const clock = entity[internal.entityAuthorityClock];

    if (
      packet.clock > clock ||
      (packet.clock === clock && entity.authority !== undefined && from! < entity.authority)
    ) {
      announceAuthority(entity, packet.clock, from);
    } else {
      net.send(from, {
        t: "DenyExclusiveAuthority",
        entity: entity.ref,
        clock: clock,
        current_authority: entity.authority,
      });
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
        entity.transform[internal.transformForceUpdate](
          new Transform({
            position: report.position,
            rotation: report.rotation,
            scale: report.scale,
            z: entity.transform.z,
          }),
        );
        entity.transform[internal.transformOnChanged]();
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
