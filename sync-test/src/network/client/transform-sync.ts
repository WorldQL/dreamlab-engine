import { EntityExclusiveAuthorityChanged } from "@dreamlab/engine";
import { ClientNetworkSetupRoutine } from "./net-connection.ts";
import * as internal from "../../../../engine/internal.ts";

export const handleTransformSync: ClientNetworkSetupRoutine = (conn, game) => {
  game.on(EntityExclusiveAuthorityChanged, event => {
    if (event.authority === conn.id) {
      conn.send({
        t: "RequestExclusiveAuthority",
        entity: event.entity.ref,
        clock: event.clock,
      });
    } else if (event.entity.authority === conn.id) {
      conn.send({
        t: "RelinquishExclusiveAuthority",
        entity: event.entity.ref,
      });
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
