import { z } from "zod";
import {
  ArgsChangedSchema,
  CustomMessageSchema,
  DestroyEntitySchema,
  LabelChangedSchema,
  PhysicsSuspendResumeSchema,
  SpawnEntitySchema,
  TagsChangedSchema,
  TransformChangedSchema,
  TupleVectorSchema,
  UpdateSyncedValueSchema,
} from "./shared.ts";

const BaseGearSchema = z.any();

export const HandshakeReadySchema = z.object({
  t: z.literal("HandshakeReady"),
});

export const ChatMessageSchema = z.object({
  t: z.literal("ChatMessage"),

  from_id: z.string(),
  from_nick: z.string(),
  message: z.string(),
});

export const PlayerMotionSchema = z.object({
  t: z.literal("PlayerMotion"),

  position: TupleVectorSchema,
  velocity: TupleVectorSchema,
  flipped: z.boolean(),
  tick_number: z.number().int(),
});

export const PlayerInputsPacketSchema = z.object({
  t: z.literal("PlayerInputs"),

  tick_number: z.number().int(),
  jump: z.boolean(),
  fall_through: z.boolean(),
  left: z.boolean(),
  right: z.boolean(),
  attack: z.boolean(),
  jog: z.boolean(),
});

export const PlayerCharacterIdChangeSchema = z.object({
  t: z.literal("PlayerCharacterIdChange"),

  character_id: z.string().nullable(),
});

export const PlayerAnimationChangeSchema = z.object({
  t: z.literal("PlayerAnimationChange"),

  animation: z.string(),
});

export const PlayerGearChangeSchema = z.object({
  t: z.literal("PlayerGearChange"),

  gear: BaseGearSchema.nullable(),
});

export const PhysicsRequestObjectControlSchema = z.object({
  t: z.literal("PhysicsRequestObjectControl"),

  entity_id: z.string(),
});

export const PhysicsControlledObjectsSnapshotSchema = z.object({
  t: z.literal("PhysicsControlledObjectsSnapshot"),
  tick_number: z.number(),
  snapshot: z.unknown(),
});

export const RequestFullSnapshotSchema = z.object({
  t: z.literal("RequestFullSnapshot"),
});

export const ClientToServerPacketSchema = z.discriminatedUnion("t", [
  HandshakeReadySchema,
  ChatMessageSchema,
  CustomMessageSchema,
  SpawnEntitySchema,
  DestroyEntitySchema,
  ArgsChangedSchema,
  LabelChangedSchema,
  TagsChangedSchema,
  TransformChangedSchema,
  PhysicsSuspendResumeSchema,
  PlayerCharacterIdChangeSchema,
  PlayerAnimationChangeSchema,
  PlayerInputsPacketSchema,
  PlayerMotionSchema,
  PlayerGearChangeSchema,
  PhysicsRequestObjectControlSchema,
  PhysicsControlledObjectsSnapshotSchema,
  RequestFullSnapshotSchema,
  UpdateSyncedValueSchema,
]);

export type ClientToServerPacket = z.infer<typeof ClientToServerPacketSchema>;
