import { z } from "zod";

const SpawnableDefinitionSchema = z.unknown();

export type CustomMessagePacket = z.infer<typeof CustomMessageSchema>;
export const CustomMessageSchema = z.object({
  t: z.literal("CustomMessage"),

  messages: z
    .object({
      channel: z.string(),
      data: z.record(z.string(), z.unknown()),
    })
    .array(),
});

export const TupleVectorSchema = z.tuple([z.number(), z.number()]);
export const ObjectVectorSchema = z.object({ x: z.number(), y: z.number() });

export const SpawnEntitySchema = z.object({
  t: z.literal("SpawnEntity"),
  definition: SpawnableDefinitionSchema,
});

export const DestroyEntitySchema = z.object({
  t: z.literal("DestroyEntity"),
  entity_id: z.string(),
});

export const TransformChangedSchema = z.object({
  t: z.literal("TransformChanged"),

  entity_id: z.string(),
  position: TupleVectorSchema,
  rotation: z.number(),
  z_index: z.number(),
});

export const ArgsChangedSchema = z.object({
  t: z.literal("ArgsChanged"),

  entity_id: z.string(),
  path: z.string(),
  value: z.unknown(),
});

export const LabelChangedSchema = z.object({
  t: z.literal("LabelChanged"),

  entity_id: z.string(),
  label: z.string().optional(),
});

export const TagsChangedSchema = z.object({
  t: z.literal("TagsChanged"),

  entity_id: z.string(),
  tags: z.string().array(),
});

export const PhysicsSuspendResumeSchema = z.object({
  t: z.literal("PhysicsSuspendResume"),

  entity_id: z.string(),
  action: z.enum(["suspend", "resume"]),
});

export const UpdateSyncedValueSchema = z.object({
  t: z.literal("UpdateSyncedValue"),
  values: z
    .object({
      entity_id: z.string(),
      key: z.string(),
      value: z.unknown(),
    })
    .array(),
});
