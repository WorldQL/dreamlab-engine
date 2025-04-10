import { SyncedObjectOperationSchema } from "@dreamlab/engine";
import * as internal from "@dreamlab/engine/internal";
import { ClientNetworkSetupRoutine } from "./net-connection.ts";

export const handleObjectSync: ClientNetworkSetupRoutine = (net, game) => {
  game.sync.listen((object, clock, op) => {
    net.send({
      t: "SyncedObjectOperation",
      clock,
      containerId: object.containerId,
      objectRef: object.field,
      op,
    });
  });

  net.registerPacketHandler("SyncedObjectOperation", packet => {
    const op = SyncedObjectOperationSchema.parse(packet.op);

    const container = game.sync.get(packet.containerId);
    if (!container) return;
    const object = container[internal.syncedObjectContainerObjectsField];
    if (!object) return;

    const synced = object.get(packet.objectRef);
    if (synced) synced.receive(packet.from ?? "server", packet.clock, op);
  });
};
