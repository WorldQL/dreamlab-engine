import { ConnectionId, PlayerJoined, PlayerLeft } from "@dreamlab/engine";
import { ServerNetworkSetupRoutine } from "./net-manager.ts";
import { serializeEntityDefinition } from "@dreamlab/proto/common/entity-sync.ts";
import { PlayerConnectionDropped } from "@dreamlab/proto/common/signals.ts";

export const handlePlayerJoinExchange: ServerNetworkSetupRoutine = (net, game) => {
  const connectionStates = new Map<ConnectionId, "initialized" | "loaded">();

  net.registerPacketHandler("LoadPhaseChanged", async (from, packet) => {
    const connectionState = connectionStates.get(from);

    if (connectionState === undefined && packet.phase === "initialized") {
      connectionStates.set(from, packet.phase);

      const worldEntities = [];
      for (const child of game.world.children.values()) {
        worldEntities.push(
          serializeEntityDefinition(game, child.getDefinition(), game.world.ref),
        );
      }

      const prefabEntities = [];
      for (const child of game.prefabs.children.values()) {
        prefabEntities.push(
          serializeEntityDefinition(game, child.getDefinition(), game.prefabs.ref),
        );
      }

      net.send(from, {
        t: "InitialNetworkSnapshot",
        worldEntities: await Promise.all(worldEntities),
        prefabEntities: await Promise.all(prefabEntities),
      });
    }

    if (connectionState === "initialized" && packet.phase === "loaded") {
      connectionStates.set(from, packet.phase);
      const connection = net.clients.get(from);
      if (connection) game.fire(PlayerJoined, connection);
    }
  });

  game.on(PlayerConnectionDropped, ({ connection }) => {
    const connectionState = connectionStates.get(connection.id);
    if (connectionState === "loaded") game.fire(PlayerLeft, connection);
    connectionStates.delete(connection.id);
  });
};
