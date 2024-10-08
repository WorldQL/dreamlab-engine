import { z } from "@dreamlab/vendor/zod.ts";

export const EntityReferenceSchema = z.string().describe("Entity Reference");
export const EntityTypeSchema = z.string().describe("Entity Type");

export const ConnectionIdSchema = z.literal("server").or(z.string()).describe("Connection ID");

export const BehaviorDefinitionSchema = z.object({
  script: z.string(),
  values: z.record(z.string(), z.any()),
  ref: z.string(),
});

export const Vector2Schema = z
  .object({
    x: z.number(),
    y: z.number(),
  })
  .describe("Vector2");

export const TransformSchema = z.object({
  position: Vector2Schema.default({ x: 0, y: 0 }),
  rotation: z.number().default(0),
  scale: Vector2Schema.default({ x: 1, y: 1 }),
  z: z.number().default(0),
});

// we need to do a little ceremony since EntityDefinitionSchema is recursively defined
const BaseEntityDefinitionSchema = z.object({
  type: EntityTypeSchema,
  parent: EntityReferenceSchema,
  name: z.string(),
  enabled: z.boolean().optional(),
  values: z.record(z.string(), z.any()).optional(),
  behaviors: BehaviorDefinitionSchema.array().optional(),
  transform: TransformSchema.optional(),
  ref: EntityReferenceSchema,
  authority: ConnectionIdSchema.optional(),
});
type EntityDefinitionSchemaTypeIn = z.input<typeof BaseEntityDefinitionSchema> & {
  children?: EntityDefinitionSchemaTypeIn[];
};
type EntityDefinitionSchemaTypeOut = z.output<typeof BaseEntityDefinitionSchema> & {
  children?: EntityDefinitionSchemaTypeOut[];
};
export const EntityDefinitionSchema: z.ZodType<
  EntityDefinitionSchemaTypeOut,
  z.ZodTypeDef,
  EntityDefinitionSchemaTypeIn
> = BaseEntityDefinitionSchema.extend({
  children: z.lazy(() => EntityDefinitionSchema.array().default([])),
});
export type EntityDefinitionSchemaType = z.infer<typeof EntityDefinitionSchema>;
