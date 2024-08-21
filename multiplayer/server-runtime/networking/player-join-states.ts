import { ConnectionId, PlayerJoined, PlayerLeft, ServerRoot } from "@dreamlab/engine";
import * as internal from "@dreamlab/engine/internal";
import { serializeEntityDefinition } from "@dreamlab/proto/common/entity-sync.ts";
import { PlayerConnectionDropped } from "@dreamlab/proto/common/signals.ts";
import { PlayPacket } from "@dreamlab/proto/play.ts";
import { ServerNetworkSetupRoutine } from "./net-manager.ts";

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
        worldEntities,
        prefabEntities,
      });

      // TODO: send RichReportValues here after we have packet queue handling in the client
    }

    if (connectionState === "initialized" && packet.phase === "loaded") {
      const valueReports: PlayPacket<"RichReportValues", "server">["reports"] = [];
      for (const value of game.values.values) {
        if (value[internal.valueRelatedEntity]?.root instanceof ServerRoot) continue;
        valueReports.push({
          identifier: value.identifier,
          clock: value.clock,
          source: value.lastSource,
          value: value.value,
        });
      }

      net.send(from, { t: "RichReportValues", reports: valueReports });

      connectionStates.set(from, packet.phase);
      const connection = net.clients.get(from);
      if (connection) {
        game.fire(PlayerJoined, connection);
        net.broadcast({ t: "PlayerJoined", connection_id: connection.id });
      }
    }
  });

  game.on(PlayerConnectionDropped, ({ connection }) => {
    const connectionState = connectionStates.get(connection.id);
    if (connectionState === "loaded") game.fire(PlayerLeft, connection);
    connectionStates.delete(connection.id);
  });
};
