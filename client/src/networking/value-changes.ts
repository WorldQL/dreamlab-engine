import { ClientGame, GameStatus, GameTick, Value, ValueChanged } from "@dreamlab/engine";
import * as internal from "../../../engine/internal.ts";
import { ClientConnection, ClientNetworkSetupRoutine } from "./net-connection.ts";

export const handleValueChanges: ClientNetworkSetupRoutine = (
  conn: ClientConnection,
  game: ClientGame,
) => {
  const dirtyValues = new Map<Value, number>();

  game.values.on(ValueChanged, event => {
    if (game.status !== GameStatus.Running) return;

    if (!event.value.replicated) return;
    if (event.from !== conn.id) return;

    const relatedEntity = event.value[internal.valueRelatedEntity];
    if (
      relatedEntity &&
      !(relatedEntity.root === game.world || relatedEntity.root === game.prefabs)
    )
      return;

    dirtyValues.set(event.value, event.clock);
  });

  game.on(GameTick, () => {
    const reports: { identifier: string; value: unknown; clock: number }[] = [];

    for (const [valueObj, momentaryClock] of dirtyValues.entries()) {
      if (valueObj.clock > momentaryClock) continue;

      const value = valueObj.adapter
        ? valueObj.adapter.convertToPrimitive(valueObj.value)
        : valueObj.value;

      reports.push({ identifier: valueObj.identifier, value, clock: valueObj.clock });
    }

    if (reports.length > 0) {
      conn.send({ t: "ReportValues", reports });
    }
    dirtyValues.clear();
  });

  conn.registerPacketHandler("ReportValues", packet => {
    if (packet.from === conn.id) return;

    for (const report of packet.reports) {
      const value = game.values.lookup(report.identifier);
      if (!value || !value.replicated) continue;

      game.values.fire(
        ValueChanged,
        value,
        report.value,
        report.clock,
        packet.from ?? "server",
      );
    }
  });
};
