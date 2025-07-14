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

    const syncedObjectReports: PlayPacket<"SyncedObjectReports", "client">["reports"] = {};
    let modified = false;

    for (const op of syncedObjectOpQueue) {
      syncedObjectOpQueue.delete(op);

      const container = game.sync.get(op.object.containerId);
      if (!container) continue;

      syncedObjectReports[op.object.containerId] ??= {};
      syncedObjectReports[op.object.containerId][op.object.field] ??= [];
      const arr = syncedObjectReports[op.object.containerId][op.object.field];

      arr.push({ clock: op.clock, op: op.op });
      modified = true;
    }

    if (modified) {
      net.send({ t: "SyncedObjectReports", reports: syncedObjectReports });
    }
  });

  net.registerPacketHandler("SyncedObjectReports", packet => {
    if (packet.denials) {
      for (const [containerId, fields] of Object.entries(packet.denials)) {
        for (const [field, arr] of Object.entries(fields)) {
          for (const inner of arr) {
            const denial = { containerId, field, ...inner };
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
      }
    }

    for (const [containerId, fields] of Object.entries(packet.reports)) {
      for (const [field, arr] of Object.entries(fields)) {
        for (const inner of arr) {
          const report = { containerId, field, ...inner };
          if (report.from === net.id) continue;

          const op = SyncedObjectOperationSchema.parse(report.op);

          const container = game.sync.get(report.containerId);
          if (!container) continue;
          const objects = container[internal.syncedObjectContainerObjectsField];
          if (!objects) continue;
          const object = objects.get(report.field);
          if (object) object.receive(report.from ?? "server", report.clock, op);
        }
      }
    }
  });
};
