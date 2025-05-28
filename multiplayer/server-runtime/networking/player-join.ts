import { ConnectionId, Entity, PlayerJoined } from "@dreamlab/engine";
import { createEntityDefinition } from "@dreamlab/proto/common/entity-sync.ts";
import { EntityDefinitionSchemaType } from "@dreamlab/proto/datamodel.ts";
import { createId } from "@dreamlab/vendor/nanoid.ts";
import { ServerNetworkSetupRoutine } from "./net-manager.ts";

export const handlePlayerJoinExchange: ServerNetworkSetupRoutine = (net, game) => {
  const connectionStates = new Map<ConnectionId, "initialized" | "loaded">();

  net.registerPacketHandler("LoadPhaseChanged", (from, packet) => {
    const connectionState = connectionStates.get(from);
    if (connectionState !== undefined || packet.phase !== "initialized") {
      return;
    }
    connectionStates.set(from, "initialized");

    (async () => {
      const spawnOpId = createId("spwn");

      let hasSentFirst = false;
      let definitions: EntityDefinitionSchemaType[] = [];
      const send = () => {
        if (definitions.length === 0) return;
        if (!hasSentFirst) {
          net.send(from, { t: "StartSpawnOperation", op: spawnOpId, definitions });
          hasSentFirst = true;
        } else {
          net.send(from, { t: "AddEntitiesToSpawnOperation", op: spawnOpId, definitions });
        }

        definitions = [];
      };

      const entityQueue = new Set<Entity>();
      for (const entity of game.world.entities) entityQueue.add(entity);
      for (const entity of game.prefabs.entities) entityQueue.add(entity);

      for (const entity of entityQueue) {
        if (!entity.parent) continue;

        if (definitions.length >= 5_000) {
          send();
          await new Promise(resolve => setTimeout(resolve, 100));
        }

        const definition = createEntityDefinition(entity);
        definitions.push(definition);
      }
      send();

      net.send(from, { t: "FinishSpawnOperation", op: spawnOpId, isInitialLoad: true });
    })();
  });

  net.registerPacketHandler("LoadPhaseChanged", (from, packet) => {
    const connectionState = connectionStates.get(from);
    if (connectionState !== "initialized") return;
    if (packet.phase !== "loaded") return;
    connectionStates.set(from, "loaded");

    // TODO: send something like RichReportValues

    const connection = net.clients.get(from);
    if (!connection) return;

    game.fire(PlayerJoined, connection);
    net.broadcast({ t: "PlayerJoined", connection_id: connection.id });
  });
};
