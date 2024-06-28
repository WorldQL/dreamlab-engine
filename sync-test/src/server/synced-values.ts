import { SyncedValueChanged } from "@dreamlab/engine";
import { ServerPacketHandler } from "./net-manager.ts";

export const handleSyncedValues: ServerPacketHandler<"SetSyncedValue"> = (net, game) => {
  game.syncedValues.on(SyncedValueChanged, event => {
    if (!event.value.replicated) return;

    const value = event.value.adapter
      ? event.value.adapter.convertToPrimitive(event.newValue)
      : event.newValue;

    net.broadcast({
      t: "SetSyncedValue",
      identifier: event.value.identifier,
      generation: event.generation,
      value,
      originator: event.originator,
    });
  });

  return (from, packet) => {
    const value = game.syncedValues.lookup(packet.identifier);
    if (!value || !value.replicated) return;
    game.syncedValues.fire(SyncedValueChanged, value, packet.value, packet.generation, from);
  };
};
