import { ConnectionId, Entity } from "@dreamlab/engine";
import { ServerNetworkSetupRoutine } from "./net-manager.ts";

export const handlePlayerJoinExchange: ServerNetworkSetupRoutine = (net, game) => {
  const connectionStates = new Map<ConnectionId, "initialized" | "loaded">();

  net.registerPacketHandler("LoadPhaseChanged", (from, packet) => {
    const connectionState = connectionStates.get(from);
    if (connectionState !== undefined || packet.phase !== "initialized") {
      return;
    }
    connectionStates.set(from, "initialized");

    // TODO: load all the world state onto this client
    (async () => {
      const entityQueue = new Set<Entity>();
    })();
  });
};
