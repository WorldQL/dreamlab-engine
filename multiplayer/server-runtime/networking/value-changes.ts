import { GameStatus, GameTick, Value, ValueChanged } from "@dreamlab/engine";
import * as internal from "../../../engine/internal.ts";
import { ServerNetworkSetupRoutine } from "./net-manager.ts";
import { PlayPacket } from "@dreamlab/proto/play.ts";

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
    const affectedValues = new Map<string, Value>();

    for (const report of packet.reports) {
      const value = game.values.lookup(report.identifier);
      if (!value || !value.replicated) continue;
      affectedValues.set(report.identifier, value);
      game.values.fire(ValueChanged, value, report.value, report.clock, from);
    }

    const validReports = packet.reports.filter(
      report => affectedValues.get(report.identifier)?.lastSource === from,
    );

    net.broadcast({
      t: "ReportValues",
      from,
      reports: validReports,
    });

    const richReports: PlayPacket<"RichReportValues", "server">["reports"] = [];
    for (const value of affectedValues.values()) {
      if (value.lastSource === from) continue;
      richReports.push({
        identifier: value.identifier,
        clock: value.clock,
        source: value.lastSource === "server" ? undefined : value.lastSource,
        value: value.value,
      });
    }

    if (richReports.length > 0) net.send(from, { t: "RichReportValues", reports: richReports });
  });
};
