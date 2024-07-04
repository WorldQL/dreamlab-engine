import { z } from "zod";
import { ClientToServerPacketSchema } from "../play-proto/mod.ts";

export const ConnectionEstablishedSchema = z.object({
  op: z.literal("ConnectionEstablished"),
  connectionId: z.string(),
  playerId: z.string(),
  characterId: z.string().nullable(),
  nickname: z.string(),
});

export const ConnectionDroppedSchema = z.object({
  op: z.literal("ConnectionDropped"),
  connectionId: z.string(),
});

export const IncomingPacketSchema = z.object({
  op: z.literal("IncomingPacket"),
  connectionId: z.string(),
  packet: ClientToServerPacketSchema,
});

export const GetKvValueResponseSchema = z.object({
  op: z.literal("GetKvValueResponse"),
  world: z.string(),
  key: z.string(),
  value: z.string().optional(),
});

export const HostToWorkerMessageSchema = z.discriminatedUnion("op", [
  ConnectionEstablishedSchema,
  ConnectionDroppedSchema,
  IncomingPacketSchema,
  GetKvValueResponseSchema,
]);
export type HostToWorkerMessage = z.infer<typeof HostToWorkerMessageSchema>;
