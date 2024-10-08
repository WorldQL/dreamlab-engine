import { ServerGame } from "@dreamlab/engine";

export const game = new ServerGame({
  instanceId: "test",
  worldId: "test",
  network: {
    self: "server",
    connections: [],
    sendCustomMessage: () => {},
    broadcastCustomMessage: () => {},
    onReceiveCustomMessage: () => {},
    disconnect: () => {},
  },
});
