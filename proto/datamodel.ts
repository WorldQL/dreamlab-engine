import { z } from "@dreamlab/vendor/zod.ts";

export const EntityReferenceSchema = z.string().describe("Entity Reference");
export const EntityTypeSchema = z.string().describe("Entity Type");

export const ConnectionIdSchema = z
  .string()
  .optional()
  .describe("Connection ID (or undefined for server)");

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

// we need to do a little ceremony since EntityDefinitionSchema is recursively defined
const BaseEntityDefinitionSchema = z.object({
  type: EntityTypeSchema,
  parent: EntityReferenceSchema,
  name: z.string(),
  values: z.record(z.string(), z.any()).optional(),
  behaviors: BehaviorDefinitionSchema.array().optional(),
  transform: z
    .object({
      position: Vector2Schema.optional(),
      rotation: z.number().optional(),
      scale: Vector2Schema.optional(),
    })
    .optional(),
  ref: EntityReferenceSchema,
  authority: ConnectionIdSchema,
});
export type EntityDefinitionSchemaType = z.infer<typeof BaseEntityDefinitionSchema> & {
  children?: EntityDefinitionSchemaType[];
};
export const EntityDefinitionSchema: z.ZodType<EntityDefinitionSchemaType> =
  BaseEntityDefinitionSchema.extend({
    children: z.lazy(() => EntityDefinitionSchema.array().optional()),
  });
