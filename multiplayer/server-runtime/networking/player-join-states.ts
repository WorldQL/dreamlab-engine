import {
  BaseTilemap,
  ConnectionId,
  PlayerJoined,
  PlayerLeft,
  ServerRoot,
} from "@dreamlab/engine";
import * as internal from "@dreamlab/engine/internal";
import { serializeEntityDefinition } from "@dreamlab/proto/common/entity-sync.ts";
import { PlayerConnectionDropped } from "@dreamlab/proto/common/signals.ts";
import { PlayPacket, ServerPacket } from "@dreamlab/proto/play.ts";
import { EntitySchema, getSceneFromProject, ProjectSchema } from "@dreamlab/scene";
import type * as z from "@dreamlab/vendor/zod.ts";
import { ServerNetworkSetupRoutine } from "./net-manager.ts";

export const handlePlayerJoinExchange: ServerNetworkSetupRoutine = (net, game) => {
  const connectionStates = new Map<ConnectionId, "initialized" | "loaded">();

  net.registerPacketHandler("LoadPhaseChanged", async (from, packet) => {
    const connectionState = connectionStates.get(from);

    if (connectionState === undefined && packet.phase === "initialized") {
      connectionStates.set(from, packet.phase);

      const auxPackets: ServerPacket[] = [];

      // TODO: remove hack
      // BEGIN HACK: load scene def for use below
      const projectDesc = await game
        .fetch("res://project.json")
        .then(r => r.text())
        .then(JSON.parse)
        .then(ProjectSchema.parse);
      const scene = await getSceneFromProject(game, projectDesc, "main");
      // END HACK

      const worldEntities = [];
      for (const child of game.world.children.values()) {
        const isTilemap = child instanceof BaseTilemap;
        worldEntities.push(
          serializeEntityDefinition(
            game,
            child[internal.entityGenerateDefinition]({
              withRefs: true,
              forNetwork: true,
              withData: !isTilemap,
            }),
            game.world.ref,
          ),
        );

        if (isTilemap) {
          for (const chunk of child[internal.tilemapChunkMap].values()) {
            auxPackets.push({
              t: "DumpTilemap",
              ref: child.ref,
              chunkX: chunk.x,
              chunkY: chunk.y,
              type: chunk.type,
              data: chunk.save(),
            });
          }
        }
      }

      const prefabEntities = [];
      for (const child of game.prefabs.children.values()) {
        const serialized = serializeEntityDefinition(
          game,
          child[internal.entityGenerateDefinition]({
            withRefs: true,
            forNetwork: true,
            withData: true,
          }),
          game.prefabs.ref,
        );

        // BEGIN HACK: load values from scene def
        const overwriteValues = (
          serialized: ReturnType<typeof serializeEntityDefinition>,
          sceneDef: z.infer<typeof EntitySchema>,
        ) => {
          for (const value in serialized.values) {
            if (serialized.values[value] === undefined) {
              serialized.values[value] = sceneDef.values[value];
            }
          }

          const behaviors = serialized.behaviors ?? [];
          for (const behavior of behaviors) {
            const behaviorDef = sceneDef.behaviors.find(x => x.ref === behavior.ref);
            if (!behaviorDef) continue;

            for (const value in behavior.values) {
              if (behavior.values[value] === undefined) {
                behavior.values[value] = behaviorDef.values[value];
              }
            }
          }

          const children = serialized.children ?? [];
          for (const child of children) {
            const childSceneDef = sceneDef.children.find(x => x.ref === child.ref);
            if (!childSceneDef) continue;
            overwriteValues(child, childSceneDef);
          }
        };

        const sceneDef = scene.prefabs.find(x => x.ref === serialized.ref);
        if (sceneDef) overwriteValues(serialized, sceneDef);
        // END HACK

        prefabEntities.push(serialized);
      }

      net.send(from, {
        t: "InitialNetworkSnapshot",
        worldEntities,
        prefabEntities,
      });

      // TODO: send aux packets
      for (const packet of auxPackets) net.send(from, packet);
    }

    if (connectionState === "initialized" && packet.phase === "loaded") {
      const valueReports: PlayPacket<"RichReportValues", "server">["reports"] = [];
      for (const value of game.values.values) {
        const _value = value.adapter
          ? value.adapter.convertToPrimitive(value.value)
          : value.value;
        if (value[internal.valueRelatedEntity]?.root instanceof ServerRoot) continue;
        valueReports.push({
          identifier: value.identifier,
          clock: value.clock,
          source: value.lastSource,
          value: _value,
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
