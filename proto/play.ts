import { z } from "zod";

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
  value: z.any().optional(),
  generation: z.number(),
});

export const ServerSetSyncedValuePacketSchema =
  ClientSetSyncedValuePacketSchema.extend({
    originator: z.string().optional(),
  });

export const ClientPacketSchema = z.discriminatedUnion("t", [
  ClientChatMessagePacketSchema,
  ClientSetSyncedValuePacketSchema,
]);
export type ClientPacket = z.infer<typeof ClientPacketSchema>;

export const ServerPacketSchema = z.discriminatedUnion("t", [
  HandshakePacketSchema,
  ServerChatMessagePacketSchema,
  ServerSetSyncedValuePacketSchema,
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
