import { ClientGame, SyncedValueChanged } from "@dreamlab/engine";
import { ClientConnection, ClientNetworkSetupRoutine } from "./net-connection.ts";

export const handleSyncedValues: ClientNetworkSetupRoutine = (
  conn: ClientConnection,
  game: ClientGame,
) => {
  game.syncedValues.on(SyncedValueChanged, event => {
    if (!event.value.replicated) return;
    if (event.from !== conn.id) return;

    const value = event.value.adapter
      ? event.value.adapter.convertToPrimitive(event.newValue)
      : event.newValue;

    conn.send({
      t: "SetSyncedValue",
      identifier: event.value.identifier,
      value,
      generation: event.generation,
    });
  });

  conn.registerPacketHandler("SetSyncedValue", packet => {
    if (packet.from === conn.id) return;

    const value = game.syncedValues.lookup(packet.identifier);
    if (!value || !value.replicated) return;

    game.syncedValues.fire(
      SyncedValueChanged,
      value,
      packet.value,
      packet.generation,
      packet.from,
    );
  });
};
