import { z } from "zod";
import { ServerToClientPacketSchema } from "../play-proto/mod.ts";

export const WorkerUpSchema = z.object({
  op: z.literal("WorkerUp"),
});

export const LogLineSchema = z.object({
  op: z.literal("LogLine"),
  message: z.string(),
});

export const HeartbeatSchema = z.object({
  op: z.literal("Heartbeat"),
  timestamp_ms: z.number(),
});

export const OutgoingPacketSchema = z.object({
  op: z.literal("OutgoingPacket"),
  connectionId: z.string().nullable(), // null to broadcast
  packet: ServerToClientPacketSchema,
});

export const MultiOutgoingPacketsSchema = z.object({
  op: z.literal("MultiOutgoingPackets"),
  packets: z.tuple([z.string().nullable(), ServerToClientPacketSchema]).array(),
});

export const SetStatusSchema = z.object({
  op: z.literal("SetStatus"),
  status: z.any(),
});

export const GetKvValueRequestSchema = z.object({
  op: z.literal("GetKvValueRequest"),
  key: z.string(),
  world: z.string(),
});

export const SetKvValueSchema = z.object({
  op: z.literal("SetKvValue"),
  world: z.string(),
  key: z.string(),
  value: z.string(),
});

export const DeleteKvValueSchema = z.object({
  op: z.literal("DeleteKvValue"),
  world: z.string(),
  key: z.string(),
});

export const LogMessageSchema = z.object({
  op: z.literal("LogMessage"),
  level: z.union([
    z.literal("debug"),
    z.literal("info"),
    z.literal("warn"),
    z.literal("error"),
  ]),
  message: z.string(),
  detail: z.any().nullable(),
});

export const TracerBatchExportSchema = z.object({
  op: z.literal("TracerBatchExport"),
  path: z.string(),
});

export const WorkerToHostMessageSchema = z.discriminatedUnion("op", [
  WorkerUpSchema,
  LogLineSchema,
  HeartbeatSchema,
  OutgoingPacketSchema,
  MultiOutgoingPacketsSchema,
  SetStatusSchema,
  GetKvValueRequestSchema,
  SetKvValueSchema,
  DeleteKvValueSchema,
  LogMessageSchema,
  TracerBatchExportSchema,
]);
export type WorkerToHostMessage = z.infer<typeof WorkerToHostMessageSchema>;
