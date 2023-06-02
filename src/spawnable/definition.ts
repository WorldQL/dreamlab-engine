import { z } from 'zod'
import { VectorSchema } from '~/math/vector.js'
import { lookupSpawnableFn } from '~/spawnable/spawn.js'

const OptionalSpawnableContextSchema = z.object({
  uid: z.string().cuid2(),
  tags: z.string().array(),
  zIndex: z.number(),
})

const SpawnableContextSchemaRequired = z.object({
  preview: z.boolean(),
  position: VectorSchema,
})

const EntityFunctionSchema = z.string().refine(
  name => lookupSpawnableFn(name) !== undefined,
  name => ({ message: `unknown entityFn: ${name}` }),
)

export type SpawnableDefinition = z.infer<typeof SpawnableDefinitionSchema>
export const SpawnableDefinitionSchema = SpawnableContextSchemaRequired.merge(
  OptionalSpawnableContextSchema.partial(),
)
  .omit({
    preview: true,
  })
  .extend({
    entityFn: EntityFunctionSchema,
    args: z.unknown().array(),
  })

export type SpawnableContext = z.infer<typeof SpawnableContextSchema>
export const SpawnableContextSchema = SpawnableContextSchemaRequired.merge(
  OptionalSpawnableContextSchema,
).extend({
  definition: SpawnableDefinitionSchema,
})
