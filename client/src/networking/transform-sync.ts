import {
  Entity,
  EntityDescendantSpawned,
  EntityExclusiveAuthorityChanged,
  EntityTransformUpdate,
  InternalGameTick,
  ITransform,
  Transform,
} from "@dreamlab/engine";
import * as internal from "@dreamlab/engine/internal";
import { transformFor, transformsEq } from "@dreamlab/proto/common/transform.ts";
import { PlayPacket } from "@dreamlab/proto/play.ts";
import { Simplify } from "@dreamlab/vendor/type-fest.ts";
import { ClientNetworkSetupRoutine } from "./net-connection.ts";

export const handleTransformSync: ClientNetworkSetupRoutine = (conn, game) => {
  const ignoredEntityRefs = new Set<string>();
  const transformDirtyEntities = new Set<Entity>();

  const lastTransforms = new WeakMap<Entity, ITransform>();

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
    ref: [],
    posX: [],
    posY: [],
    rot: [],
    sclX: [],
    sclY: [],
    z: [],
    tp: [],
  };

  game.on(
    InternalGameTick,
    () => {
      for (const entity of transformDirtyEntities.values()) {
        if (entity.name.includes(".NoNetTransform")) {
          continue;
        }

        if (entity.authority !== undefined && entity.authority !== game.network.self) continue;

        const currTransform = transformFor(entity);
        const lastTransform = lastTransforms.get(entity);
        if (!lastTransform || !transformsEq(lastTransform, currTransform)) {
          lastTransforms.set(entity, currTransform);

          const transform = entity.transform;
          entityTransformReports.ref.push(entity.ref);
          entityTransformReports.posX.push(transform.position.x);
          entityTransformReports.posY.push(transform.position.y);
          entityTransformReports.rot.push(transform.rotation);
          entityTransformReports.sclX.push(transform.scale.x);
          entityTransformReports.sclY.push(transform.scale.y);
          entityTransformReports.z.push(transform.z);
          entityTransformReports.tp.push(entity[internal.entityTeleportingThisTick]);
        }
      }

      if (entityTransformReports.ref.length > 0) {
        conn.send({
          t: "ReportEntityTransforms",
          ...entityTransformReports,
        });

        // clear arrays
        entityTransformReports.ref.length = 0;
        entityTransformReports.posX.length = 0;
        entityTransformReports.posY.length = 0;
        entityTransformReports.rot.length = 0;
        entityTransformReports.sclX.length = 0;
        entityTransformReports.sclY.length = 0;
        entityTransformReports.z.length = 0;
        entityTransformReports.tp.length = 0;
      }

      transformDirtyEntities.clear();
    },
    { priority: -10 },
  );

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
    for (let i = 0; i < packet.ref.length; i++) {
      const entity = game.entities.lookupByRef(packet.ref[i]);
      if (entity === undefined) continue;
      if (entity.authority === conn.id && packet.from !== undefined) continue;

      ignoredEntityRefs.add(entity.ref);
      entity[internal.transformFromNetwork](
        packet.from ?? "server",
        new Transform({
          position: {
            x: packet.posX[i],
            y: packet.posY[i],
          },
          rotation: packet.rot[i],
          scale: {
            x: packet.sclX[i],
            y: packet.sclY[i],
          },
          z: packet.z[i],
        }),
        packet.tp[i],
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
