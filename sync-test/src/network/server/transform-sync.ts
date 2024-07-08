import { ConnectionId, Entity } from "@dreamlab/engine";
import { ServerNetworkSetupRoutine } from "./net-manager.ts";

export const handleTransformSync: ServerNetworkSetupRoutine = (net, game) => {
  const entityAuthorityInfo = new WeakMap<Entity, { clock: number; authority: ConnectionId }>();

  function announceAuthority(entity: Entity, clock: number, authority: ConnectionId) {
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
    const authorityInfo = entityAuthorityInfo.get(entity);
    if (authorityInfo === undefined) {
      announceAuthority(entity, packet.clock, from);
      return;
    }

    if (
      packet.clock > authorityInfo.clock ||
      (packet.clock === authorityInfo.clock &&
        authorityInfo.authority !== undefined &&
        from! < authorityInfo.authority)
    ) {
      announceAuthority(entity, packet.clock, from);
    }
  });

  net.registerPacketHandler("RelinquishExclusiveAuthority", (from, packet) => {
    const entity = game.entities.lookupByRef(packet.entity);
    if (entity === undefined) return;
    const info = entityAuthorityInfo.get(entity);
    if (info === undefined) return;
    if (info.authority !== from) return;
    announceAuthority(entity, info.clock + 1, undefined);
  });

  // TODO: entity authority snapshot when a player joins
};
