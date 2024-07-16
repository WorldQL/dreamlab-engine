import {
  Entity,
  EntityExclusiveAuthorityChanged,
  EntityTransformUpdate,
} from "@dreamlab/engine";
import { ClientNetworkSetupRoutine } from "./net-connection.ts";
import * as internal from "../../../../engine/internal.ts";

export const handleTransformSync: ClientNetworkSetupRoutine = (conn, game) => {
  const authorityTransformListeners = new WeakMap<
    Entity,
    (event: EntityTransformUpdate) => void
  >();

  game.on(EntityExclusiveAuthorityChanged, event => {
    const entity = event.entity;
    if (event.authority === conn.id) {
      conn.send({
        t: "RequestExclusiveAuthority",
        entity: entity.ref,
        clock: event.clock,
      });

      const transformListener = (event: EntityTransformUpdate) => {
        conn.send({
          t: "ReportEntityTransform",
          entity: entity.ref,
          position: entity.transform.position.bare(),
          rotation: entity.transform.rotation,
          scale: entity.transform.scale.bare(),
        });
      };
      authorityTransformListeners.set(event.entity, transformListener);
      entity.on(EntityTransformUpdate, transformListener);
    } else if (entity.authority === conn.id) {
      conn.send({
        t: "RelinquishExclusiveAuthority",
        entity: entity.ref,
      });
      const transformListener = authorityTransformListeners.get(entity);
      if (transformListener) {
        entity.unregister(EntityTransformUpdate, transformListener);
        authorityTransformListeners.delete(entity);
      }
    }
  });

  conn.registerPacketHandler("ReportEntityTransform", packet => {
    const entity = game.entities.lookupByRef(packet.entity);
    if (entity === undefined) return;
    if (packet.from === entity.authority) {
      entity.transform.position.assign(packet.position);
      entity.transform.rotation = packet.rotation;
      entity.transform.scale.assign(packet.scale);
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
    entity[internal.entityForceAuthorityValues](entity.authority, packet.clock);
  });
};
