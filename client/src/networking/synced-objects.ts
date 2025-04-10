import { SyncedObjectOperationSchema } from "@dreamlab/engine";
import * as internal from "@dreamlab/engine/internal";
import { ClientNetworkSetupRoutine } from "./net-connection.ts";

export const handleObjectSync: ClientNetworkSetupRoutine = (net, game) => {
  game.sync.listen((object, clock, op) => {
    net.send({
      t: "SyncedObjectOperation",
      clock,
      containerId: object.containerId,
      field: object.field,
      op,
    });
  });

  net.registerPacketHandler("SyncedObjectOperation", packet => {
    const op = SyncedObjectOperationSchema.parse(packet.op);

    const container = game.sync.get(packet.containerId);
    if (!container) return;
    const objects = container[internal.syncedObjectContainerObjectsField];
    if (!objects) return;
    const object = objects.get(packet.field);
    if (object) object.receive(packet.from ?? "server", packet.clock, op);
  });
};
