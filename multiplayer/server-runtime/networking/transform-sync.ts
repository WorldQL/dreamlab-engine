import {
  ConnectionId,
  Entity,
  EntityDescendantSpawned,
  EntityExclusiveAuthorityChanged,
  EntityTransformUpdate,
  InternalGameTick,
  IVector2,
  Transform,
} from "@dreamlab/engine";
import * as internal from "@dreamlab/engine/internal";
import { PlayPacket } from "@dreamlab/proto/play.ts";
import { Simplify } from "@dreamlab/vendor/type-fest.ts";
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
    entity.on(EntityTransformUpdate, ({ source, fromNetwork }) => {
      if (source !== entity) return;
      if (fromNetwork !== undefined) return;

      if (!ignoredEntityRefs.has(source.ref)) {
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
      // if (entity.authority !== undefined && entity.authority !== game.network.self) continue;

      if (entity.name.includes(".NoNetTransform")) {
        continue;
      }

      const currTransform = transformFor(entity);
      const lastTransform = lastTransforms.get(entity);
      if (!lastTransform || !transformsEq(lastTransform, currTransform)) {
        lastTransforms.set(entity, currTransform);

        entityTransformReports.entities.push(entity.ref);
        entityTransformReports.positions.push(entity.transform.position.bare());
        entityTransformReports.rotations.push(entity.transform.rotation);
        entityTransformReports.scales.push(entity.transform.scale.bare());
        entityTransformReports.zs.push(entity.transform.z);
        entityTransformReports.teleports.push(entity[internal.entityTeleportingThisTick]);
        entityTransformReports.parents.push(entity.parent?.ref);
      }

      if (entityTransformReports.entities.length > 0) {
        net.broadcast({
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
    }
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

  game.on(EntityExclusiveAuthorityChanged, event => {
    announceAuthority(event.entity, event.clock, event.authority);
  });

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
    for (let i = 0; i < packet.entities.length; i++) {
      const entity = game.entities.lookupByRef(packet.entities[i]);
      if (entity === undefined) return;
      if (entity.authority === undefined || from === entity.authority) {
        ignoredEntityRefs.add(entity.ref);
        entity[internal.transformFromNetwork](
          from,
          new Transform({
            position: packet.positions[i],
            rotation: packet.rotations[i],
            scale: packet.scales[i],
            z: packet.zs[i],
          }),
          true,
        );
        ignoredEntityRefs.delete(entity.ref);
      }
    }

    net.broadcast({
      ...packet,
      from,
    });
  });
};
