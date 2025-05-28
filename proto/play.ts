import { z } from "@dreamlab/vendor/zod.ts";
import {
  ConnectionIdSchema,
  EntityDefinitionSchema,
  EntityReferenceSchema,
  Vector2Schema,
} from "./datamodel.ts";

export const PLAY_PROTO_VERSION = 2;

export const HandshakePacketSchema = z.object({
  t: z.literal("Handshake"),
  version: z.number(),
  connection_id: ConnectionIdSchema,
  world_id: z.string(),
  player_id: z.string(),
  world_script_base_url: z.string(),
  edit_mode: z.boolean(),
});

export const ClientLoadPhaseChangedPacket = z.object({
  t: z.literal("LoadPhaseChanged"),
  phase: z.enum(["initialized", "loaded"]),
});

export const PingPacketSchema = z.object({
  t: z.literal("Ping"),
  type: z.enum(["ping", "pong"]),
  timestamp: z.number().int(),
});

// #region custom messages
const BaseCustomMessagePacket = z.object({
  t: z.literal("CustomMessage"),
  channel: z.string(),
  data: z.any(),
});
export const ClientCustomMessagePacket = BaseCustomMessagePacket.extend({
  to: ConnectionIdSchema.or(z.literal("*")).optional(),
});
export const ServerCustomMessagePacket = BaseCustomMessagePacket.extend({
  from: ConnectionIdSchema.optional(),
});
// #endregion

// #region peer list packets
export const ServerPeerConnectedPacket = z.object({
  t: z.literal("PeerConnected"),
  connection_id: ConnectionIdSchema,
  player_id: z.string(),
  nickname: z.string(),
});

export const ServerPeerDisconnectedPacket = z.object({
  t: z.literal("PeerDisconnected"),
  connection_id: ConnectionIdSchema,
});

export const ServerPeerChangedNicknamePacket = z.object({
  t: z.literal("PeerChangedNickname"),
  connection_id: ConnectionIdSchema,
  new_nickname: z.string(),
});

export const ServerPeerListSnapshotPacket = z.object({
  t: z.literal("PeerListSnapshot"),
  peers: z
    .object({ connection_id: ConnectionIdSchema, player_id: z.string(), nickname: z.string() })
    .array(),
});

export const ServerPlayerJoinedPacket = z.object({
  t: z.literal("PlayerJoined"),
  connection_id: ConnectionIdSchema,
});
// #endregion

// #region entity sync packets
export const SpawnEntitiesPacketSchema = z.object({
  t: z.literal("SpawnEntities"),
  definitions: EntityDefinitionSchema.array(),
});
export const ServerSpawnEntitiesPacketSchema = SpawnEntitiesPacketSchema.extend({
  from: ConnectionIdSchema.optional(),
});

export const DeleteEntitiesPacketSchema = z.object({
  t: z.literal("DeleteEntities"),
  entities: EntityReferenceSchema.array(),
});
export const ServerDeleteEntitiesPacketSchema = DeleteEntitiesPacketSchema.extend({
  from: ConnectionIdSchema.optional(),
});

export const ReparentEntitiesPacketSchema = z.object({
  t: z.literal("ReparentEntities"),
  sources: EntityReferenceSchema.array(),
  targets: EntityReferenceSchema.array(),
});
export const ServerReparentEntitiesPacketSchema = ReparentEntitiesPacketSchema.extend({
  from: ConnectionIdSchema,
});

export const RenameEntitiesPacketSchema = z.object({
  t: z.literal("RenameEntities"),
  entities: EntityReferenceSchema.array(),
  names: z.string().array(),
});
export const ServerRenameEntitiesPacketSchema = RenameEntitiesPacketSchema.extend({
  from: ConnectionIdSchema,
});

// large spawn operations
export const StartSpawnOperationPacketSchema = z.object({
  t: z.literal("StartSpawnOperation"),
  op: z.string(),
  definitions: EntityDefinitionSchema.array(),
});
export const ServerStartSpawnOperationPacketSchema = StartSpawnOperationPacketSchema.extend({
  from: ConnectionIdSchema.optional(),
});
export const AddEntitiesToSpawnOperationPacketSchema = z.object({
  t: z.literal("AddEntitiesToSpawnOperation"),
  op: z.string(),
  definitions: EntityDefinitionSchema.array(),
});
export const ServerAddEntitiesToSpawnOperationPacketSchema =
  AddEntitiesToSpawnOperationPacketSchema.extend({ from: ConnectionIdSchema.optional() });
export const FinishSpawnOperationPacketSchema = z.object({
  t: z.literal("FinishSpawnOperation"),
  op: z.string(),
});
export const ServerFinishSpawnOperationPacketSchema = FinishSpawnOperationPacketSchema.extend({
  from: ConnectionIdSchema.optional(),
  isInitialLoad: z.boolean().optional(),
});
// #endregion

// #region transform report packets
export type EntityTransformReport = z.infer<typeof EntityTransformReportSchema>;
export const EntityTransformReportSchema = z.object({
  entity: EntityReferenceSchema,
  position: Vector2Schema,
  rotation: z.number(),
  scale: Vector2Schema,
  z: z.number(),
  teleport: z.boolean().optional(),
  parent: EntityReferenceSchema.optional(),
});

export const ReportEntityTransformsPacketSchema = z.object({
  t: z.literal("ReportEntityTransforms"),
  reports: EntityTransformReportSchema.array(),
});
export const ServerReportEntityTransformsPacketSchema =
  ReportEntityTransformsPacketSchema.extend({
    from: ConnectionIdSchema.optional(),
  });
// #endregion

// packets that originate from the client
export const ClientPacketSchema = z.discriminatedUnion("t", [
  ClientLoadPhaseChangedPacket,
  PingPacketSchema,
  ClientCustomMessagePacket,
  SpawnEntitiesPacketSchema,
  DeleteEntitiesPacketSchema,
  ReparentEntitiesPacketSchema,
  RenameEntitiesPacketSchema,
  ReportEntityTransformsPacketSchema,
]);
export type ClientPacket = z.infer<typeof ClientPacketSchema>;

// packets that originate from the server
export const ServerPacketSchema = z.discriminatedUnion("t", [
  HandshakePacketSchema,
  PingPacketSchema,
  ServerCustomMessagePacket,
  ServerPeerConnectedPacket,
  ServerPeerDisconnectedPacket,
  ServerPeerChangedNicknamePacket,
  ServerPeerListSnapshotPacket,
  ServerPlayerJoinedPacket,
  ServerSpawnEntitiesPacketSchema,
  ServerDeleteEntitiesPacketSchema,
  ServerReparentEntitiesPacketSchema,
  ServerRenameEntitiesPacketSchema,
  ServerReportEntityTransformsPacketSchema,
  ServerStartSpawnOperationPacketSchema,
  ServerAddEntitiesToSpawnOperationPacketSchema,
  ServerFinishSpawnOperationPacketSchema,
]);
export type ServerPacket = z.infer<typeof ServerPacketSchema>;

export type PlayPacket<
  T extends (ClientPacket | ServerPacket)["t"] | undefined = undefined,
  Side extends "server" | "client" | "any" = "any",
> = (Side extends "any"
  ? ClientPacket | ServerPacket
  : Side extends "client"
    ? ClientPacket
    : ServerPacket) &
  (T extends string ? { t: T } : object);
