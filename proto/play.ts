import { z } from "@dreamlab/vendor/zod.ts";
import {
  BehaviorDefinitionSchema,
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

// #region synced values
export type ValueReport = z.infer<typeof ValueReportSchema>;
export const ValueReportSchema = z.object({
  entity: EntityReferenceSchema.optional(),
  identifier: z.string(),
  value: z.any(),
  clock: z.number(),
});
export const ReportValuesPacketSchema = z.object({
  t: z.literal("ReportValues"),
  reports: ValueReportSchema.array(),
});
export const ServerReportValuesPacketSchema = ReportValuesPacketSchema.extend({
  from: ConnectionIdSchema.optional(),
});
// #endregion

// #region entity authority
export const ClientRequestExclusiveAuthorityPacket = z.object({
  t: z.literal("RequestExclusiveAuthority"),
  entity: EntityReferenceSchema,
  clock: z.number(),
});

export const ClientRelinquishExclusiveAuthorityPacket = z.object({
  t: z.literal("RelinquishExclusiveAuthority"),
  entity: EntityReferenceSchema,
});

export const ServerAnnounceExclusiveAuthorityPacket = z.object({
  t: z.literal("AnnounceExclusiveAuthority"),
  entity: EntityReferenceSchema,
  to: ConnectionIdSchema.optional(),
  clock: z.number(),
});

// sent to the requester to let them know the correct clock value
export const ServerDenyExclusiveAuthorityPacket = z.object({
  t: z.literal("DenyExclusiveAuthority"),
  entity: EntityReferenceSchema,
  clock: z.number(),
  current_authority: ConnectionIdSchema.optional(),
});
// #endregion

// #region behavior editing
export const AddBehaviorPacketSchema = z.object({
  t: z.literal("AddBehavior"),
  entity: EntityReferenceSchema,
  behavior: BehaviorDefinitionSchema,
});

export const RemoveBehaviorPacketSchema = z.object({
  t: z.literal("RemoveBehavior"),
  entity: EntityReferenceSchema,
  behavior: z.string().describe("behavior ref"),
});
// #endregion

// #region synced objects
export type SyncedObjectReport = z.infer<typeof SyncedObjectReportSchema>;
export const SyncedObjectReportSchema = z.object({
  containerId: z.string(),
  field: z.string(),
  clock: z.number(),
  op: z.unknown(),
});
export const ReportSyncedObjectOpsPacketSchema = z.object({
  t: z.literal("ReportSyncedObjectOps"),
  reports: SyncedObjectReportSchema.array(),
});
export const ServerReportSyncedObjectOpsPacketSchema = ReportSyncedObjectOpsPacketSchema.extend(
  {
    from: ConnectionIdSchema.optional(),
  },
);
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
  ReportValuesPacketSchema,
  ClientRequestExclusiveAuthorityPacket,
  ClientRelinquishExclusiveAuthorityPacket,
  AddBehaviorPacketSchema,
  RemoveBehaviorPacketSchema,
  ReportSyncedObjectOpsPacketSchema,
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
  ServerReportValuesPacketSchema,
  ServerAnnounceExclusiveAuthorityPacket,
  ServerDenyExclusiveAuthorityPacket,
  ServerReportSyncedObjectOpsPacketSchema,
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
