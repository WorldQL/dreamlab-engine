import { ConnectionId, Entity } from "@dreamlab/engine";
import { ServerNetworkSetupRoutine } from "./net-manager.ts";
import * as internal from "../../../engine/internal.ts";

export const handleTransformSync: ServerNetworkSetupRoutine = (net, game) => {
  function announceAuthority(entity: Entity, clock: number, authority: ConnectionId) {
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

  net.registerPacketHandler("ReportEntityTransform", (from, packet) => {
    const entity = game.entities.lookupByRef(packet.entity);
    if (entity === undefined) return;
    if (from === entity.authority) {
      entity.transform.position.assign(packet.position);
      entity.transform.rotation = packet.rotation;
      entity.transform.scale.assign(packet.scale);
    }
  });

  // TODO: entity authority snapshot when a player joins
};
