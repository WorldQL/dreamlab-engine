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

// as an optimization we filter out old operations that are overruled by new ones,
// but the merge semantics for each synced object operation are different.
// we start by hand-defining how problem ops overrule, and we can make this generic later
/// does a overrule b?
const syncedOpOverrules = (
  a: { clock: number; op: SyncedObjectOperation },
  b: { clock: number; op: SyncedObjectOperation },
) => {
  return (
    a.clock > b.clock &&
    a.op.t === "deep-object-set" &&
    b.op.t === "deep-object-set" &&
    a.op.key === b.op.key
  );
};

function filterInPlace<T>(a: T[], condition: (this: T[], e: T, i: number) => boolean) {
  let j = 0;

  for (let i = 0; i < a.length; i++) {
    const e = a[i];
    if (!condition.call(a, e, i)) continue;
    if (i !== j) a[j] = e;
    j++;
  }

  a.length = j;
  return a;
}

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
      const arr = syncedObjectReports[op.object.containerId][op.object.field] ?? [];
      filterInPlace(arr, b => !syncedOpOverrules(op, b as SyncedObjectOpInfo));
      arr.push({ clock: op.clock, op: op.op });
      syncedObjectReports[op.object.containerId][op.object.field] = arr;
      modified = true;
    }

    if (modified) {
      net.send({ t: "SyncedObjectReports", reports: syncedObjectReports });
    }
  });

  net.registerPacketHandler("SyncedObjectReports", packet => {
    if (packet.denials) {
      for (const [containerId, fields] of Object.entries(packet.denials)) {
        const container = game.sync.get(containerId);
        if (!container) continue;
        const objects = container[internal.syncedObjectContainerObjectsField];
        if (!objects) continue;

        for (const [field, arr] of Object.entries(fields)) {
          const object = objects.get(field);
          if (!object) continue;

          for (const denial of arr) {
            if (denial.to !== net.id) continue;

            object.clock = denial.clock;
            object.lastWriter = undefined;
            object.setup(denial.value);
          }
        }
      }
    }

    for (const [containerId, fields] of Object.entries(packet.reports)) {
      const container = game.sync.get(containerId);
      if (!container) continue;
      const objects = container[internal.syncedObjectContainerObjectsField];
      if (!objects) continue;

      for (const [field, arr] of Object.entries(fields)) {
        const object = objects.get(field);

        for (const report of arr) {
          if (report.from === net.id) continue;

          const op = SyncedObjectOperationSchema.parse(report.op);
          if (object) object.receive(report.from ?? "server", report.clock, op);
        }
      }
    }
  });
};
