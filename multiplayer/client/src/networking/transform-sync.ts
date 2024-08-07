import {
  Entity,
  EntityDescendantSpawned,
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

  const addTransformListener = (entity: Entity) => {
    const transformListener = (_event: EntityTransformUpdate) => {
      if (entity.authority !== game.network.connectionId) return;
      conn.send({
        t: "ReportEntityTransform",
        entity: entity.ref,
        position: entity.transform.position.bare(),
        rotation: entity.transform.rotation,
        scale: entity.transform.scale.bare(),
      });
    };
    authorityTransformListeners.set(entity, transformListener);
    entity.on(EntityTransformUpdate, transformListener);
  };

  const removeTransformListener = (entity: Entity) => {
    const transformListener = authorityTransformListeners.get(entity);
    if (!transformListener) return;

    entity.unregister(EntityTransformUpdate, transformListener);
    authorityTransformListeners.delete(entity);
  };

  game.world.on(EntityDescendantSpawned, event => {
    const entity = event.descendant;
    if (entity.authority === game.network.connectionId) {
      addTransformListener(entity);
    }
  });

  game.on(EntityExclusiveAuthorityChanged, event => {
    const entity = event.entity;
    if (event.authority === conn.id) {
      conn.send({
        t: "RequestExclusiveAuthority",
        entity: entity.ref,
        clock: event.clock,
      });
      addTransformListener(event.entity);
    } else if (entity.authority === conn.id) {
      conn.send({
        t: "RelinquishExclusiveAuthority",
        entity: entity.ref,
      });
      removeTransformListener(event.entity);
    }
  });

  conn.registerPacketHandler("ReportEntityTransform", packet => {
    const entity = game.entities.lookupByRef(packet.entity);
    if (entity === undefined) return;
    if (packet.from === entity.authority && packet.from !== conn.id) {
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
