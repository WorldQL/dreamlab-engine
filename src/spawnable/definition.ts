import { z } from 'zod'
import { TransformSchema } from '~/math/transform.js'
import type { LooseTransform, Transform } from '~/math/transform.js'

export interface SpawnableDefinition<
  Args extends Record<string, unknown> = Record<string, unknown>,
> {
  entity: string
  args: Args
  transform: Transform
  uid?: string
  label?: string | undefined
  tags: string[]
}

export interface LooseSpawnableDefinition<
  Name extends string = string,
  Args extends Record<string, unknown> = Record<string, unknown>,
> {
  entity: Name
  args: Args
  transform: LooseTransform
  uid?: string
  label?: string | undefined
  tags?: string[]
}

export const SpawnableDefinitionSchemaInternal = z.object({
  entity: z.string(),
  args: z.record(z.string(), z.unknown()),
  transform: TransformSchema,
  uid: z.string().cuid2().optional(),
  label: z.string().optional(),
  tags: z.string().array().default([]),
})

export const SpawnableDefinitionSchema =
  SpawnableDefinitionSchemaInternal as z.ZodType<SpawnableDefinition>
