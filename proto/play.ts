import { z } from "@dreamlab/vendor/zod.ts";
import {
  BehaviorDefinitionSchema,
  ConnectionIdSchema,
  EntityDefinitionSchema,
  EntityReferenceSchema,
  Vector2Schema,
} from "./datamodel.ts";

export const PLAY_PROTO_VERSION = 1;

export const HandshakePacketSchema = z.object({
  t: z.literal("Handshake"),
  version: z.number(),
  connection_id: ConnectionIdSchema,
  world_id: z.string(),
  player_id: z.string(),
  world_script_base_url: z.string(),
  edit_mode: z.boolean(),
});

export const PingPacketSchema = z.object({
  t: z.literal("Ping"),
  type: z.enum(["ping", "pong"]),
  timestamp: z.number().int(),
});

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

export const ClientChatMessagePacket = z.object({
  t: z.literal("ChatMessage"),
  message: z.string(),
});

export const ServerChatMessagePacket = ClientChatMessagePacket.extend({
  from_player_id: z.string(),
  from_connection_id: z.string(),
  from_nickname: z.string(),
});

const ValueReportSchema = z.object({
  identifier: z.string(),
  value: z.any(),
  clock: z.number(),
});
export const ClientReportValuesPacket = z.object({
  t: z.literal("ReportValues"),
  reports: ValueReportSchema.array(),
});

export const ServerReportValuesPacketSchema = ClientReportValuesPacket.extend({
  from: ConnectionIdSchema.optional(),
});

export const ServerRichReportValuesPacketSchema = z.object({
  t: z.literal("RichReportValues"),
  reports: ValueReportSchema.extend({ source: ConnectionIdSchema.optional() }).array(),
});

export const ClientSpawnEntityPacket = z.object({
  t: z.literal("SpawnEntity"),
  definition: EntityDefinitionSchema,
});

export const ServerSpawnEntityPacket = ClientSpawnEntityPacket.extend({
  from: ConnectionIdSchema.optional(),
});

export const ClientDeleteEntityPacket = z.object({
  t: z.literal("DeleteEntity"),
  entity: EntityReferenceSchema,
});

export const ServerDeleteEntityPacket = ClientDeleteEntityPacket.extend({
  from: ConnectionIdSchema.optional(),
});

const BaseRenameEntityPacket = z.object({
  t: z.literal("RenameEntity"),
  entity: EntityReferenceSchema,
  name: z.string(),
});
export const ClientRenameEntityPacket = BaseRenameEntityPacket.extend({
  // the server will drop your request if the current server-side name does not match old_name
  old_name: z.string(),
});
export const ServerRenameEntityPacket = BaseRenameEntityPacket.extend({
  from: ConnectionIdSchema.optional(),
});

const BaseReparentEntityPacket = z.object({
  t: z.literal("ReparentEntity"),
  entity: EntityReferenceSchema,
  parent: EntityReferenceSchema,
});
export const ClientReparentEntityPacket = BaseReparentEntityPacket.extend({
  old_parent: EntityReferenceSchema.optional(),
});
export const ServerReparentEntityPacket = BaseReparentEntityPacket.extend({
  from: ConnectionIdSchema.optional(),
});

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

// clients can only report transform for entities over which they have exclusive authority
export type EntityTransformReport = z.infer<typeof EntityTransformReportSchema>;
export const EntityTransformReportSchema = z.object({
  entity: EntityReferenceSchema,
  position: Vector2Schema,
  rotation: z.number(),
  scale: Vector2Schema,
  z: z.number(),
});

export const ClientReportEntityTransformsPacket = z.object({
  t: z.literal("ReportEntityTransforms"),
  reports: EntityTransformReportSchema.array(),
});

export const ServerReportEntityTransformsPacket = ClientReportEntityTransformsPacket.extend({
  from: ConnectionIdSchema.optional(),
});

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

export const ClientLoadPhaseChangedPacket = z.object({
  t: z.literal("LoadPhaseChanged"),
  phase: z.enum(["initialized", "loaded"]),
});

export const ServerInitialNetworkSnapshotPacket = z.object({
  t: z.literal("InitialNetworkSnapshot"),
  worldEntities: EntityDefinitionSchema.array(),
  prefabEntities: EntityDefinitionSchema.array(),
});

export const ServerScriptEditedPacket = z.object({
  t: z.literal("ScriptEdited"),
  script_location: z.string(),
  behavior_script_id: z.string().optional(),
});

export const ClientSpawnBehaviorPacket = z.object({
  t: z.literal("SpawnBehavior"),
  entity: EntityReferenceSchema,
  definition: BehaviorDefinitionSchema,
});

export const ServerSpawnBehaviorPacket = ClientSpawnBehaviorPacket.extend({
  from: ConnectionIdSchema.optional(),
});

export const ClientDeleteBehaviorPacket = z.object({
  t: z.literal("DeleteBehavior"),
  entity: EntityReferenceSchema,
  behavior: z.string(),
});

export const ServerDeleteBehaviorPacket = ClientDeleteBehaviorPacket.extend({
  from: ConnectionIdSchema.optional(),
});

export const ClientEntityEnableChanged = z.object({
  t: z.literal("EntityEnableChanged"),
  entity: EntityReferenceSchema,
  enabled: z.boolean(),
});

export const ServerEntityEnableChanged = ClientEntityEnableChanged.extend({
  from: ConnectionIdSchema.optional(),
});

export const ClientPacketSchema = z.discriminatedUnion("t", [
  PingPacketSchema,
  ClientLoadPhaseChangedPacket,
  ClientChatMessagePacket,
  ClientSpawnEntityPacket,
  ClientDeleteEntityPacket,
  ClientRenameEntityPacket,
  ClientReparentEntityPacket,
  ClientCustomMessagePacket,
  ClientRequestExclusiveAuthorityPacket,
  ClientRelinquishExclusiveAuthorityPacket,
  ClientReportEntityTransformsPacket,
  ClientReportValuesPacket,
  ClientSpawnBehaviorPacket,
  ClientDeleteBehaviorPacket,
  ClientEntityEnableChanged,
]);
export type ClientPacket = z.infer<typeof ClientPacketSchema>;

export const ServerPacketSchema = z.discriminatedUnion("t", [
  HandshakePacketSchema,
  PingPacketSchema,
  ServerInitialNetworkSnapshotPacket,
  ServerPeerConnectedPacket,
  ServerPeerDisconnectedPacket,
  ServerPeerChangedNicknamePacket,
  ServerPeerListSnapshotPacket,
  ServerPlayerJoinedPacket,
  ServerChatMessagePacket,
  ServerSpawnEntityPacket,
  ServerDeleteEntityPacket,
  ServerRenameEntityPacket,
  ServerReparentEntityPacket,
  ServerCustomMessagePacket,
  ServerAnnounceExclusiveAuthorityPacket,
  ServerDenyExclusiveAuthorityPacket,
  ServerReportEntityTransformsPacket,
  ServerReportValuesPacketSchema,
  ServerRichReportValuesPacketSchema,
  ServerScriptEditedPacket,
  ServerSpawnBehaviorPacket,
  ServerDeleteBehaviorPacket,
  ServerEntityEnableChanged,
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
