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

export const TransformSchema = z.object({
  position: VectorSchema.default({ x: 0, y: 0 }),
  scale: VectorSchema.default({ x: 1, y: 1 }),
  rotation: z.number().default(0),
  z: z.number().default(0),
});

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
type SceneDescEntityNoChildrenIn = z.input<typeof EntitySchemaNoChildren> & {
  children?: SceneDescEntityNoChildrenIn[];
};
type SceneDescEntityNoChildrenOut = z.output<typeof EntitySchemaNoChildren> & {
  children: SceneDescEntityNoChildrenOut[];
};
export const EntitySchema: z.ZodType<
  SceneDescEntityNoChildrenOut,
  z.ZodTypeDef,
  SceneDescEntityNoChildrenIn
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

export const ProjectSchema = z.object({
  meta: z.object({
    schema_version: z.number(),
    engine_revision: z.string(),
  }),
  scenes: z.object({ main: SceneSchema }).and(z.record(SceneSchema)),
});

export type Scene = z.input<typeof SceneSchema>;
export type Project = z.input<typeof ProjectSchema>;
