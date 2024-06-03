import { z } from "zod";
import {
  EntityDefinitionSchema,
  EntityReferenceSchema,
  PrimitiveValueSchema,
} from "./datamodel.ts";

export const PLAY_PROTO_VERSION = 1;

export const HandshakePacketSchema = z.object({
  t: z.literal("Handshake"),
  version: z.number(),
  instance_id: z.string(),
  world_id: z.string(),
});

export const ClientChatMessagePacketSchema = z.object({
  t: z.literal("ChatMessage"),
  message: z.string(),
});

export const ServerChatMessagePacketSchema =
  ClientChatMessagePacketSchema.extend({
    from_player_id: z.string(),
    from_connection_id: z.string(),
    from_nickname: z.string(),
  });

export const ClientSetSyncedValuePacketSchema = z.object({
  t: z.literal("SetSyncedValue"),
  identifier: z.string(),
  value: PrimitiveValueSchema.optional(),
  generation: z.number(),
});

export const ServerSetSyncedValuePacketSchema =
  ClientSetSyncedValuePacketSchema.extend({
    originator: z.string().optional(),
  });

export const ClientSpawnEntityPacket = z.object({
  t: z.literal("SpawnEntity"),
  definition: EntityDefinitionSchema,
});

export const ServerSpawnEntityPacket = ClientSpawnEntityPacket.extend({
  originator: z.string().optional(),
});

export const ClientDeleteEntityPacket = z.object({
  t: z.literal("DeleteEntity"),
  entity: EntityReferenceSchema,
});

export const ServerDeleteEntityPacket = ClientDeleteEntityPacket.extend({
  originator: z.string().optional(),
});

// TODO: entity rename, reparent, etc etc

export const ClientPacketSchema = z.discriminatedUnion("t", [
  ClientChatMessagePacketSchema,
  ClientSetSyncedValuePacketSchema,
  ClientSpawnEntityPacket,
  ClientDeleteEntityPacket,
]);
export type ClientPacket = z.infer<typeof ClientPacketSchema>;

export const ServerPacketSchema = z.discriminatedUnion("t", [
  HandshakePacketSchema,
  ServerChatMessagePacketSchema,
  ServerSetSyncedValuePacketSchema,
  ServerSpawnEntityPacket,
  ServerDeleteEntityPacket,
]);
export type ServerPacket = z.infer<typeof ServerPacketSchema>;

export type PlayPacket<
  T extends string | undefined = undefined,
  Side extends "server" | "client" | "any" = "any"
> = (Side extends "any"
  ? ClientPacket | ServerPacket
  : Side extends "client"
  ? ClientPacket
  : ServerPacket) &
  (T extends string ? { t: T } : object);
