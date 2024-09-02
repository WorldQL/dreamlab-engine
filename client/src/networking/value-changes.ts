import { ClientGame, GameStatus, GameTick, Value } from "@dreamlab/engine";
import * as internal from "@dreamlab/engine/internal";
import { ClientConnection, ClientNetworkSetupRoutine } from "./net-connection.ts";

export const handleValueChanges: ClientNetworkSetupRoutine = (
  conn: ClientConnection,
  game: ClientGame,
) => {
  const dirtyValues = new Map<Value, number>();

  game.values.onValueChanged((value, _newValue, clock, source) => {
    if (game.status !== GameStatus.Running) return;
    if (!value.replicated) return;
    if (source !== conn.id) return;

    const relatedEntity = value[internal.valueRelatedEntity];
    if (
      relatedEntity &&
      !(relatedEntity.root === game.world || relatedEntity.root === game.prefabs)
    )
      return;

    dirtyValues.set(value, clock);
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

      game.values.applyValueUpdate(value, report.value, report.clock, packet.from ?? "server");
    }
  });

  conn.registerPacketHandler("RichReportValues", packet => {
    for (const report of packet.reports) {
      const value = game.values.lookup(report.identifier);
      if (!value || !value.replicated) continue;
      game.values.applyValueUpdate(
        value,
        report.value,
        report.clock,
        report.source ?? "server",
      );
    }
  });
};
