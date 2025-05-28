import { ClientGame } from "@dreamlab/engine";
import { ReceivedInitialNetworkSnapshot } from "@dreamlab/proto/common/signals.ts";
import { EntityDefinitionSchemaType } from "@dreamlab/proto/datamodel.ts";
import { PlayPacket } from "@dreamlab/proto/play.ts";
import { ClientConnection, ClientNetworkSetupRoutine } from "./net-connection.ts";

interface LargeSpawnOperation {
  id: string;
  definitions: EntityDefinitionSchemaType[];
  localEntities: Map<string, EntityDefinitionSchemaType>;
  from?: string;
}
const createLargeSpawnOperation = (id: string): LargeSpawnOperation => {
  return { id, definitions: [], localEntities: new Map() };
};
const addEntityToLargeSpawnOperation = (
  op: LargeSpawnOperation,
  def: EntityDefinitionSchemaType,
) => {
  op.localEntities.set(def.ref, def);
  const parent = op.localEntities.get(def.parent);
  if (parent) {
    parent.children ??= [];
    parent.children.push(def);
  } else {
    op.definitions.push(def);
  }
};

export const handleProtractedEntitySpawnOperations: ClientNetworkSetupRoutine = (
  conn: ClientConnection,
  game: ClientGame,
) => {
  const inFlightSpawnOperations = new Map<string, LargeSpawnOperation>();

  conn.registerPacketHandler("StartSpawnOperation", packet => {
    if (inFlightSpawnOperations.has(packet.op))
      throw new Error(
        "entity sync: already have an in-flight spawn operation with the given id",
      );

    const op = createLargeSpawnOperation(packet.op);
    op.from = packet.from;
    for (const def of packet.definitions) {
      addEntityToLargeSpawnOperation(op, def);
    }
    inFlightSpawnOperations.set(packet.op, op);
  });

  conn.registerPacketHandler("AddEntitiesToSpawnOperation", packet => {
    const op = inFlightSpawnOperations.get(packet.op);
    if (!op) throw new Error("entity sync: missing spawn operation with the given id");
    if (op.from !== packet.from)
      throw new Error("entity sync: an impostor tried to augment a spawn operation");
    for (const def of packet.definitions) {
      addEntityToLargeSpawnOperation(op, def);
    }
  });

  conn.registerPacketHandler("FinishSpawnOperation", packet => {
    const op = inFlightSpawnOperations.get(packet.op);
    if (!op) throw new Error("entity sync: missing spawn operation with the given id");
    if (op.from !== packet.from)
      throw new Error("entity sync: an impostor tried to finalize a spawn operation");

    inFlightSpawnOperations.delete(packet.op);

    if (packet.isInitialLoad) {
      conn.handle({
        t: "SpawnEntities",
        from: op.from,
        definitions: op.definitions,
        finishCallback: () => {
          game.fire(ReceivedInitialNetworkSnapshot);
        },
      } as PlayPacket<"SpawnEntities", "server">);
    } else {
      conn.handle({ t: "SpawnEntities", from: op.from, definitions: op.definitions });
    }
  });
};
