import {
  AnySyncedObject,
  GameStatus,
  InternalGameTick,
  SyncedObjectOperation,
  SyncedObjectOperationSchema,
} from "@dreamlab/engine";
import * as internal from "@dreamlab/engine/internal";
import type { PlayPacket } from "@dreamlab/proto/play.ts";
import { ClientNetworkSetupRoutine } from "./net-connection.ts";

export const handleObjectSync: ClientNetworkSetupRoutine = (net, game) => {
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

    const syncedObjectReports: PlayPacket<"SyncedObjectReports", "client">["reports"] = [];
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
      net.send({ t: "SyncedObjectReports", reports: syncedObjectReports });
    }
  });

  net.registerPacketHandler("SyncedObjectReports", packet => {
    if (packet.denials) {
      for (const denial of packet.denials) {
        if (denial.to !== net.id) continue;

        const container = game.sync.get(denial.containerId);
        if (!container) continue;
        const objects = container[internal.syncedObjectContainerObjectsField];
        if (!objects) continue;
        const object = objects.get(denial.field);
        if (!object) continue;

        object.clock = denial.clock;
        object.lastWriter = undefined;
        object.setup(denial.value);
      }
    }

    for (const report of packet.reports) {
      if (report.from === net.id) continue;

      const op = SyncedObjectOperationSchema.parse(report.op);

      const container = game.sync.get(report.containerId);
      if (!container) continue;
      const objects = container[internal.syncedObjectContainerObjectsField];
      if (!objects) continue;
      const object = objects.get(report.field);
      if (object) object.receive(report.from ?? "server", report.clock, op);
    }
  });
};
