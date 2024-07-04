import { z } from "zod";

import {
  ArgsChangedSchema,
  CustomMessageSchema,
  DestroyEntitySchema,
  LabelChangedSchema,
  ObjectVectorSchema,
  PhysicsSuspendResumeSchema,
  SpawnEntitySchema,
  TagsChangedSchema,
  TransformChangedSchema,
  TupleVectorSchema,
  UpdateSyncedValueSchema,
} from "./shared.ts";

// deno lsp hates importing schemae from npm. i'm not sure why :(
const SpawnableDefinitionSchema = z.unknown();
const BaseGearSchema = z.unknown();

export const HandshakeSchema = z.object({
  t: z.literal("Handshake"),

  protocol_version: z.number(),
  connection_id: z.string(),
  world_id: z.string(),
  world_variant: z.string(),
  edit_mode: z.boolean(),
  world_script_url_base: z.string().optional().nullable(),
  edit_secret: z.string().optional().nullable(),
});

export const DisconnectingSchema = z.object({
  t: z.literal("Disconnecting"),
  reason: z.enum(["Restarting", "ShuttingDown", "Unknown"]),
});

export const SpawnPlayerSchema = z.object({
  t: z.literal("SpawnPlayer"),

  connection_id: z.string(),
  player_id: z.string(),
  character_id: z.string().optional(),
  nickname: z.string().optional(),
  entity_id: z.string(),
  position: TupleVectorSchema,
  level: z.unknown(),
});

export const DespawnPlayerSchema = z.object({
  t: z.literal("DespawnPlayer"),

  connection_id: z.string(),
  entity_id: z.string(),
});

export const PlayerMotionInfoSchema = z.object({
  entity_id: z.string(),
  position: TupleVectorSchema,
  velocity: TupleVectorSchema,
  flipped: z.boolean(),
});

export const PlayerMotionSnapshotSchema = z.object({
  t: z.literal("PlayerMotionSnapshot"),

  motion_info: PlayerMotionInfoSchema.array(),
});

export const PlayerGearInfoSchema = z.object({
  entity_id: z.string(),
  gear: BaseGearSchema.nullable(),
});
export type PlayerGearInfo = z.infer<typeof PlayerGearInfoSchema>;

export const PlayerGearSnapshotSchema = z.object({
  t: z.literal("PlayerGearSnapshot"),

  gear_info: PlayerGearInfoSchema.array(),
});

export const PlayerCharacterIdInfoSchema = z.object({
  entity_id: z.string(),
  character_id: z.string().nullable(),
});
export type PlayerCharacterIdInfo = z.infer<typeof PlayerCharacterIdInfoSchema>;

export const PlayerCharacterIdSnapshotSchema = z.object({
  t: z.literal("PlayerCharacterIdSnapshot"),

  character_id_info: PlayerCharacterIdInfoSchema.array(),
});

export const PlayerAnimationInfoSchema = z.object({
  entity_id: z.string(),
  animation: z.string(),
});
export type PlayerAnimationInfo = z.infer<typeof PlayerAnimationInfoSchema>;

export const PlayerAnimationSnapshotSchema = z.object({
  t: z.literal("PlayerAnimationSnapshot"),

  animation_info: PlayerAnimationInfoSchema.array(),
});

export type BodyInfo = z.infer<typeof BodyInfoSchema>;
export const BodyInfoSchema = z.object({
  bodyIndex: z.number(),
  position: ObjectVectorSchema,
  velocity: ObjectVectorSchema,
  angularVelocity: z.number(),
  angle: z.number(),
});

export const EntitySnapshotSchema = z.object({
  entityId: z.string(),
  definition: SpawnableDefinitionSchema,
  bodyInfo: BodyInfoSchema.array(),
});

export const PhysicsFullSnapshotSchema = z.object({
  t: z.literal("PhysicsFullSnapshot"),
  lastClientTickNumber: z.number(),

  snapshot: z.object({
    tickNumber: z.number(),
    entities: EntitySnapshotSchema.array(),
  }),
});

export const PhysicsDeltaSnapshotSchema = z.object({
  t: z.literal("PhysicsDeltaSnapshot"),
  lastClientTickNumber: z.number(),

  snapshot: z.object({
    tickNumber: z.number(),
    newEntities: EntitySnapshotSchema.array(),
    bodyUpdates: EntitySnapshotSchema.omit({ definition: true }).array(),
    destroyedEntities: z.string().array(),
  }),
});

export const PhysicsGrantObjectControlSchema = z.object({
  t: z.literal("PhysicsGrantObjectControl"),
  entity_id: z.string(),
  expiry_tick: z.number(),
});

export const PhysicsRevokeObjectControlSchema = z.object({
  t: z.literal("PhysicsRevokeObjectControl"),
  entity_id: z.string(),
});

export const ServerToClientPacketSchema = z.discriminatedUnion("t", [
  HandshakeSchema,
  DisconnectingSchema,
  SpawnPlayerSchema,
  DespawnPlayerSchema,
  PlayerMotionSnapshotSchema,
  PlayerGearSnapshotSchema,
  PlayerCharacterIdSnapshotSchema,
  PhysicsFullSnapshotSchema,
  PhysicsDeltaSnapshotSchema,
  PlayerAnimationSnapshotSchema,
  PhysicsGrantObjectControlSchema,
  PhysicsRevokeObjectControlSchema,
  UpdateSyncedValueSchema,
  CustomMessageSchema,
  SpawnEntitySchema.extend({ connection_id: z.string() }),
  DestroyEntitySchema.extend({ connection_id: z.string() }),
  TransformChangedSchema.extend({ connection_id: z.string() }),
  ArgsChangedSchema.extend({ connection_id: z.string() }),
  LabelChangedSchema.extend({ connection_id: z.string() }),
  TagsChangedSchema.extend({ connection_id: z.string() }),
  PhysicsSuspendResumeSchema.extend({ connection_id: z.string() }),
]);

export type ServerToClientPacket = z.infer<typeof ServerToClientPacketSchema>;
