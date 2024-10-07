import { z } from "@dreamlab/vendor/zod.ts";

export const CURRENT_SCHEMA_VERSION: number = 1;

/** cuid: ent_* */
export const EntityReferenceSchema = z.string().startsWith("ent_").describe("Entity Reference");
/** cuid: bhv_* */
export const BehaviorReferenceSchema = z
  .string()
  .startsWith("bhv_")
  .describe("Behavior Reference");
/** e.g. "@core/Sprite", "@my-game/MyCustomEntity" */
export const EntityTypeSchema = z.string().describe("Entity Type");

export const ResourceLocationSchema = z.string().describe("Resource URI");

export const VectorSchema = z.object({
  x: z.number(),
  y: z.number(),
});

type Primitive = string | number | boolean | null | undefined;
type JsonArray = readonly JsonValue[];
type JsonObject = { [Key in string]?: JsonValue };
type JsonValue = Primitive | JsonArray | JsonObject;

const PrimitiveSchema: z.ZodType<Primitive> = z.union([
  z.string(),
  z.number(),
  z.boolean(),
  z.null(),
  z.undefined(),
]);

const JsonArraySchema: z.ZodType<JsonArray> = z.lazy(() => JsonValueSchema.array());
const JsonObjectSchema: z.ZodType<JsonObject> = z.lazy(() =>
  z.record(z.string(), JsonValueSchema),
);
const JsonValueSchema = z.union([PrimitiveSchema, JsonArraySchema, JsonObjectSchema]);

export const ValueSchema = JsonValueSchema;

export const TransformSchema = z.object({
  position: VectorSchema.default({ x: 0, y: 0 }),
  scale: VectorSchema.default({ x: 1, y: 1 }),
  rotation: z.number().default(0),
  z: z.number().default(0),
});
export type SceneDescTransform = z.input<typeof TransformSchema>;

export const BehaviorSchema = z.object({
  ref: BehaviorReferenceSchema,
  script: ResourceLocationSchema,
  values: z.record(ValueSchema).default({}),
});
export type SceneDescBehavior = z.input<typeof BehaviorSchema>;

const EntitySchemaNoChildren = z.object({
  ref: EntityReferenceSchema,
  name: z.string(),
  type: EntityTypeSchema,
  transform: TransformSchema.default(TransformSchema.parse({})),
  values: z.record(ValueSchema).default({}),
  behaviors: z.array(BehaviorSchema).default([]),
});
type SceneDescEntityTypeIn = z.input<typeof EntitySchemaNoChildren> & {
  children?: SceneDescEntityTypeIn[];
};
type SceneDescEntityTypeOut = z.output<typeof EntitySchemaNoChildren> & {
  children: SceneDescEntityTypeOut[];
};
export const EntitySchema: z.ZodType<
  SceneDescEntityTypeOut,
  z.ZodTypeDef,
  SceneDescEntityTypeIn
> = EntitySchemaNoChildren.extend({
  children: z.lazy(() => EntitySchema.array().default([])),
});
export type SceneDescEntity = z.input<typeof EntitySchema>;

export const SceneSchema = z.object({
  world: EntitySchema.array().default([]),
  server: EntitySchema.array().default([]),
  local: EntitySchema.array().default([]),
  prefabs: EntitySchema.array().default([]),

  registration: ResourceLocationSchema.array().default([]),
});
export const SceneOrSceneLocationSchema = SceneSchema.or(z.string());

export const ProjectSchema = z.object({
  $schema: z.string().url().optional(),
  meta: z.object({
    schema_version: z.number(),
    engine_revision: z.string(),
  }),
  scenes: z
    .object({ main: SceneOrSceneLocationSchema })
    .and(z.record(SceneOrSceneLocationSchema)),
});

export type SceneDesc = z.input<typeof SceneSchema>;
export type ProjectDesc = z.input<typeof ProjectSchema>;
