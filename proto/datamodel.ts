import { z } from "@dreamlab/vendor/zod.ts";

export const EntityReferenceSchema = z.string().describe("Entity Reference");
export const EntityTypeSchema = z.string().describe("Entity Type");

export const OriginatorSchema = z
  .string()
  .optional()
  .describe("Originating connection ID (or undefined for server)");

export const BehaviorSchema = z.object({
  script: z.string(),
  values: z.record(z.string(), z.any()),
  _ref: z.string(),
});

// we need to do a little ceremony since EntityDefinitionSchema is recursively defined
const BaseEntityDefinitionSchema = z.object({
  type: EntityTypeSchema,
  parent: EntityReferenceSchema,
  name: z.string(),
  values: z.record(z.string(), z.any()),
  behaviors: BehaviorSchema.array(),
  ref: EntityReferenceSchema.optional(),
});
export type EntityDefinitionSchemaType = z.infer<typeof BaseEntityDefinitionSchema> & {
  children: EntityDefinitionSchemaType[];
};
export const EntityDefinitionSchema: z.ZodType<EntityDefinitionSchemaType> =
  BaseEntityDefinitionSchema.extend({
    children: z.lazy(() => EntityDefinitionSchema.array()),
  });
