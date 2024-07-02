import { SyncedValueChanged } from "@dreamlab/engine";
import { ServerNetworkSetupRoutine } from "./net-manager.ts";

export const handleSyncedValues: ServerNetworkSetupRoutine = (net, game) => {
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
      from: event.from,
    });
  });

  net.registerPacketHandler("SetSyncedValue", (from, packet) => {
    const value = game.syncedValues.lookup(packet.identifier);
    if (!value || !value.replicated) return;
    game.syncedValues.fire(SyncedValueChanged, value, packet.value, packet.generation, from);
  });
};
