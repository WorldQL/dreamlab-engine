import { GameStatus, ValueChanged } from "@dreamlab/engine";
import { ServerNetworkSetupRoutine } from "./net-manager.ts";

export const handleValueChanges: ServerNetworkSetupRoutine = (net, game) => {
  game.values.on(ValueChanged, event => {
    if (game.status !== GameStatus.Running) return;
    if (!event.value.replicated) return;

    const value = event.value.adapter
      ? event.value.adapter.convertToPrimitive(event.newValue)
      : event.newValue;

    net.broadcast({
      t: "SetValue",
      identifier: event.value.identifier,
      clock: event.clock,
      value,
      from: event.from,
    });
  });

  net.registerPacketHandler("SetValue", (from, packet) => {
    const value = game.values.lookup(packet.identifier);
    if (!value || !value.replicated) return;
    game.values.fire(ValueChanged, value, packet.value, packet.clock, from);
  });
};
