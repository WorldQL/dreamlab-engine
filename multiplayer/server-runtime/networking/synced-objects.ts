import {
  AnySyncedObject,
  GameStatus,
  InternalGameTick,
  SyncedObjectOperation,
  SyncedObjectOperationSchema,
} from "@dreamlab/engine";
import * as internal from "@dreamlab/engine/internal";
import { PlayPacket } from "@dreamlab/proto/play.ts";
import type { ServerNetworkSetupRoutine } from "./net-manager.ts";

export const handleObjectSync: ServerNetworkSetupRoutine = (net, game) => {
  type SyncedObjectOpInfo = {
    object: AnySyncedObject;
    clock: number;
    op: SyncedObjectOperation;
  };
  const syncedObjectOpQueue = new Set<SyncedObjectOpInfo>();
  game.sync.listen((object, clock, op) => {
    syncedObjectOpQueue.add({ object, clock, op });
  });

  game.on(InternalGameTick, () => {
    if (game.status !== GameStatus.Running) return;

    const syncedObjectReports: PlayPacket<"SyncedObjectReports", "server">["reports"] = [];
    for (const op of syncedObjectOpQueue) {
      syncedObjectOpQueue.delete(op);

      const container = game.sync.get(op.object.containerId);
      if (!container) continue;

      syncedObjectReports.push({
        containerId: op.object.containerId,
        field: op.object.field,
        clock: op.clock,
        op: op.op,
      });
    }

    if (syncedObjectReports.length) {
      net.broadcast({ t: "SyncedObjectReports", reports: syncedObjectReports });
    }
  });

  net.registerPacketHandler("SyncedObjectReports", (from, packet) => {
    type Packet = PlayPacket<"SyncedObjectReports", "server">;
    const reports: Packet["reports"] = [];
    const denials: NonNullable<Packet["denials"]> = [];

    for (const report of packet.reports) {
      const op = SyncedObjectOperationSchema.parse(report.op);

      const container = game.sync.get(report.containerId);
      if (!container) continue;
      const objects = container[internal.syncedObjectContainerObjectsField];
      if (!objects) continue;
      const object = objects.get(report.field);
      if (!object) continue;

      if (!object.receive(from, report.clock, op)) {
        denials.push({
          to: from,
          containerId: object.containerId,
          field: object.field,
          clock: object.clock,
          value: object.serializeForNetwork(object.get()),
        });

        continue;
      }

      reports.push({ ...report, from });
    }

    if (denials.length > 0) net.broadcast({ t: "SyncedObjectReports", reports, denials });
    else net.broadcast({ t: "SyncedObjectReports", reports });
  });
};
