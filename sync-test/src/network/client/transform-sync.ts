import { ConnectionId, Entity } from "@dreamlab/engine";
import { ClientNetworkSetupRoutine } from "./net-connection.ts";

export const handleTransformSync: ClientNetworkSetupRoutine = (conn, game) => {
  // TODO: we probably want an 'authority: ConnectionId' set/get pair in Entity proper
  // that can fire signals for us, then we can send Request/Relinquish packets when it's set -- but we use a weakmap for now
  const entityAuthorityInfo = new WeakMap<Entity, { clock: number; authority: ConnectionId }>();

  conn.registerPacketHandler("ReportEntityTransform", packet => {
    const entity = game.entities.lookupByRef(packet.entity);
    if (entity === undefined) return;
    const authorityInfo = entityAuthorityInfo.get(entity);
    if (authorityInfo === undefined) return;
    if (packet.from === authorityInfo.authority) {
      entity.transform.position.assign(packet.position);
      entity.transform.rotation = packet.rotation;
      entity.transform.scale.assign(packet.scale);
    }
  });

  conn.registerPacketHandler("AnnounceExclusiveAuthority", packet => {
    const entity = game.entities.lookupByRef(packet.entity);
    if (entity === undefined) return;
    entityAuthorityInfo.set(entity, { clock: packet.clock, authority: packet.to });
  });
};
