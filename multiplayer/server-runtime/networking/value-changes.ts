import { GameStatus, GameTick, Value, ValueChanged } from "@dreamlab/engine";
import * as internal from "../../../engine/internal.ts";
import { ServerNetworkSetupRoutine } from "./net-manager.ts";

export const handleValueChanges: ServerNetworkSetupRoutine = (net, game) => {
  const dirtyValues = new Map<Value, number>();

  game.values.on(ValueChanged, event => {
    if (game.status !== GameStatus.Running) return;

    if (!event.value.replicated) return;
    if (event.from !== "server") return;

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
      net.broadcast({ t: "ReportValues", reports });
    }
    dirtyValues.clear();
  });

  net.registerPacketHandler("ReportValues", (from, packet) => {
    for (const report of packet.reports) {
      const value = game.values.lookup(report.identifier);
      if (!value || !value.replicated) continue;
      game.values.fire(ValueChanged, value, report.value, report.clock, from);
    }

    net.broadcast({
      t: "ReportValues",
      from,
      reports: packet.reports,
    });
  });
};
