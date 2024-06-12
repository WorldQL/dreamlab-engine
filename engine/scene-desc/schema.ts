import { z } from "@dreamlab/vendor/zod.ts";

export const CURRENT_SCHEMA_VERSION: number = 1;

/** cuid: ent_* */
export const EntityReferenceSchema = z.string().describe("Entity Reference");
/** cuid: bhv_* */
export const BehaviorReferenceSchema = z.string().describe("Behavior Reference");
/** e.g. "@core/Sprite", "@my-game/MyCustomEntity" */
export const EntityTypeSchema = z.string().describe("Entity Type");

export const ResourceLocationSchema = z.string().describe("Resource URI");

export const VectorSchema = z.tuple([z.number().describe("x"), z.number().describe("y")]);

export const ValueSchema = z.union([z.string(), z.number(), z.boolean(), z.null()]);

export const SceneDescTransformSchema = z.object({
  position: VectorSchema.default([0, 0]),
  scale: VectorSchema.default([1, 1]),
  rotation: z.number().default(0),
  // TODO: zIndex
});

export const SceneDescBehaviorSchema = z.object({
  ref: BehaviorReferenceSchema,
  script: ResourceLocationSchema,
  values: z.record(ValueSchema),
});

const SceneDescEntitySchemaWithoutChildren = z.object({
  ref: EntityReferenceSchema,
  name: z.string(),
  transform: SceneDescTransformSchema.default(SceneDescTransformSchema.parse({})),
  values: z.record(ValueSchema).default({}),
  behaviors: z.array(SceneDescBehaviorSchema).default([]),
});
type SceneDescEntity = z.input<typeof SceneDescEntitySchemaWithoutChildren> & {
  children?: SceneDescEntity[];
};
export const SceneDescEntitySchema: z.ZodType<SceneDescEntity> =
  SceneDescEntitySchemaWithoutChildren.extend({
    children: z.lazy(() => SceneDescEntitySchema.array().default([])),
  });

export const SceneDescSceneSchema = z.object({
  world: SceneDescEntitySchema.array().default([]),
  remote: SceneDescEntitySchema.array().default([]),
  local: SceneDescEntitySchema.array().default([]),
  prefabs: SceneDescEntitySchema.array().default([]),

  registeredEntities: ResourceLocationSchema.array().default([]),
});

export const SceneDescProjectSchema = z.object({
  meta: z.object({
    schemaVersion: z.number(),
    engineRevision: z.string(),
  }),
  scenes: z.object({ main: SceneDescSceneSchema }).and(z.record(SceneDescSceneSchema)),
});

export type Scene = z.infer<typeof SceneDescSceneSchema>;
export type Project = z.infer<typeof SceneDescProjectSchema>;
