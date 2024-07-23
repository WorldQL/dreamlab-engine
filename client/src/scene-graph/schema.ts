import { z } from "@dreamlab/vendor/zod.ts";

export const CURRENT_SCHEMA_VERSION: number = 1;

/** cuid: ent_* */
export const EntityReferenceSchema = z.string().describe("Entity Reference");
/** cuid: bhv_* */
export const BehaviorReferenceSchema = z.string().describe("Behavior Reference");
/** e.g. "@core/Sprite", "@my-game/MyCustomEntity" */
export const EntityTypeSchema = z.string().describe("Entity Type");

export const ResourceLocationSchema = z.string().describe("Resource URI");

export const VectorSchema = z.object({
  x: z.number(),
  y: z.number(),
});

export const ValueSchema = z.union([z.string(), z.number(), z.boolean(), z.null()]);

export const SceneDescTransformSchema = z.object({
  position: VectorSchema.default({ x: 0, y: 0 }),
  scale: VectorSchema.default({ x: 1, y: 1 }),
  rotation: z.number().default(0),
  z: z.number().default(0),
});

export const SceneDescBehaviorSchema = z.object({
  ref: BehaviorReferenceSchema,
  script: ResourceLocationSchema,
  values: z.record(ValueSchema),
});
export type SceneDescBehavior = z.infer<typeof SceneDescBehaviorSchema>;

const SceneDescEntitySchemaWithoutChildren = z.object({
  ref: EntityReferenceSchema,
  name: z.string(),
  type: EntityTypeSchema,
  transform: SceneDescTransformSchema.default(SceneDescTransformSchema.parse({})),
  values: z.record(ValueSchema).default({}),
  behaviors: z.array(SceneDescBehaviorSchema).default([]),
});
type SceneDescEntityIn = z.input<typeof SceneDescEntitySchemaWithoutChildren> & {
  children?: SceneDescEntityIn[];
};
type SceneDescEntityOut = z.output<typeof SceneDescEntitySchemaWithoutChildren> & {
  children: SceneDescEntityOut[];
};
export const SceneDescEntitySchema: z.ZodType<
  SceneDescEntityOut,
  z.ZodTypeDef,
  SceneDescEntityIn
> = SceneDescEntitySchemaWithoutChildren.extend({
  children: z.lazy(() => SceneDescEntitySchema.array().default([])),
});
export type SceneDescEntity = z.infer<typeof SceneDescEntitySchema>;

export const SceneSchema = z.object({
  world: SceneDescEntitySchema.array().default([]),
  remote: SceneDescEntitySchema.array().default([]),
  local: SceneDescEntitySchema.array().default([]),
  prefabs: SceneDescEntitySchema.array().default([]),

  registration: ResourceLocationSchema.array().default([]),
});

export const SceneDescProjectSchema = z.object({
  meta: z.object({
    schemaVersion: z.number(),
    engineRevision: z.string(),
  }),
  scenes: z.object({ main: SceneSchema }).and(z.record(SceneSchema)),
});

export type Scene = z.infer<typeof SceneSchema>;
export type Project = z.infer<typeof SceneDescProjectSchema>;
