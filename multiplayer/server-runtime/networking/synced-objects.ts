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
    const container = game.sync.get(object.containerId);
    if (!container || !container[internal.syncedObjectContainerReadyField]) return;

    syncedObjectOpQueue.add({ object, clock, op });
  });

  game.on(InternalGameTick, () => {
    if (game.status !== GameStatus.Running) return;

    const syncedObjectReports: PlayPacket<"SyncedObjectReports", "server">["reports"] = {};
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
      net.broadcast({ t: "SyncedObjectReports", reports: syncedObjectReports });
    }
  });

  net.registerPacketHandler("SyncedObjectReports", (from, packet) => {
    type Packet = PlayPacket<"SyncedObjectReports", "server">;
    const reports: Packet["reports"] = {};
    const denials: NonNullable<Packet["denials"]> = {};

    for (const [containerId, fields] of Object.entries(packet.reports)) {
      const container = game.sync.get(containerId);
      if (!container) continue;
      const objects = container[internal.syncedObjectContainerObjectsField];
      if (!objects) continue;

      for (const [field, arr] of Object.entries(fields)) {
        const object = objects.get(field);
        if (!object) continue;

        for (const report of arr) {
          const op = SyncedObjectOperationSchema.parse(report.op);

          if (!object.receive(from, report.clock, op)) {
            denials[object.containerId] ??= {};
            denials[object.containerId][object.field] ??= [];
            const arr = denials[object.containerId][object.field];

            arr.push({
              to: from,
              clock: object.clock,
              value: object.serializeForNetwork(object.get()),
            });

            continue;
          }

          reports[containerId] ??= {};
          reports[containerId][field] ??= [];
          const arr = reports[containerId][field];
          arr.push({ from, clock: report.clock, op: report.op });
        }
      }
    }

    net.broadcast({ t: "SyncedObjectReports", reports, denials });
  });
};
