import { SyncedObjectOperationSchema } from "@dreamlab/engine";
import * as internal from "@dreamlab/engine/internal";
import type { ServerNetworkSetupRoutine } from "./net-manager.ts";

export const handleObjectSync: ServerNetworkSetupRoutine = (net, game) => {
  game.sync.listen((object, clock, op) => {
    net.broadcast({
      t: "SyncedObjectOperation",
      clock,
      containerId: object.containerId,
      objectRef: object.field,
      op,
    });
  });

  net.registerPacketHandler("SyncedObjectOperation", (from, packet) => {
    const op = SyncedObjectOperationSchema.parse(packet.op);

    const container = game.sync.get(packet.containerId);
    if (!container) return;
    const object = container[internal.syncedObjectContainerObjectsField];
    if (!object) return;

    const synced = object.get(packet.objectRef);
    if (synced) synced.receive(from, packet.clock, op);

    net.broadcast({ ...packet, from });
  });
};
