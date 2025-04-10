import { SyncedObjectOperationSchema } from "@dreamlab/engine";
import * as internal from "@dreamlab/engine/internal";
import type { ServerNetworkSetupRoutine } from "./net-manager.ts";

export const handleObjectSync: ServerNetworkSetupRoutine = (net, game) => {
  game.sync.listen((object, clock, op) => {
    net.broadcast({
      t: "SyncedObjectOperation",
      clock,
      containerId: object.containerId,
      field: object.field,
      op,
    });
  });

  net.registerPacketHandler("SyncedObjectOperation", (from, packet) => {
    const op = SyncedObjectOperationSchema.parse(packet.op);

    const container = game.sync.get(packet.containerId);
    if (!container) return;
    const objects = container[internal.syncedObjectContainerObjectsField];
    if (!objects) return;
    const object = objects.get(packet.field);
    if (!object) return;

    if (!object.receive(from, packet.clock, op)) {
      // TODO: net.send(from, 'update denied' packet that tells you the real state)
    }

    net.broadcast({ ...packet, from });
  });
};
