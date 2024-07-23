import { ClientGame, GameStatus, ValueChanged } from "@dreamlab/engine";
import { ClientConnection, ClientNetworkSetupRoutine } from "./net-connection.ts";

export const handleValueChanges: ClientNetworkSetupRoutine = (
  conn: ClientConnection,
  game: ClientGame,
) => {
  game.values.on(ValueChanged, event => {
    if (game.status !== GameStatus.Running) return;

    if (!event.value.replicated) return;
    if (event.from !== conn.id) return;

    const value = event.value.adapter
      ? event.value.adapter.convertToPrimitive(event.newValue)
      : event.newValue;

    conn.send({
      t: "SetValue",
      identifier: event.value.identifier,
      value,
      clock: event.clock,
    });
  });

  conn.registerPacketHandler("SetValue", packet => {
    if (packet.from === conn.id) return;

    const value = game.values.lookup(packet.identifier);
    if (!value || !value.replicated) return;

    game.values.fire(ValueChanged, value, packet.value, packet.clock, packet.from);
  });
};
