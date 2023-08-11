import type { Except } from 'type-fest'
import { z } from 'zod'
import { TransformSchema } from '~/math/transform.js'
import type { LooseTransform, Transform } from '~/math/transform.js'
import type { SpawnableFunction, UID } from '~/spawnable/spawnableEntity.js'

export interface SpawnableDefinition<
  Name extends string = string,
  Args extends unknown[] = unknown[],
> {
  entity: Name
  args: Args
  transform: Transform
  uid?: UID
  tags?: string[]
  zIndex?: number
}

export interface LooseSpawnableDefinition<
  Name extends string = string,
  Args extends unknown[] = unknown[],
> {
  entity: Name
  args: Args
  transform: LooseTransform
  uid?: UID
  tags?: string[]
  zIndex?: number
}

export const SpawnableDefinitionSchemaInternal = z.object({
  entity: z.string(),
  args: z.any().array(),
  transform: TransformSchema,
  uid: z.string().cuid2().optional(),
  tags: z.string().array().optional(),
  zIndex: z.number().optional(),
})

export const SpawnableDefinitionSchema =
  SpawnableDefinitionSchemaInternal as z.ZodType<SpawnableDefinition>

export interface SpawnableContext<
  Name extends string = string,
  Args extends unknown[] = unknown[],
> extends Except<Required<SpawnableDefinition>, 'args' | 'entity'> {
  preview: boolean
  definition: SpawnableDefinition<Name, Args>
}

export type InferDefinition<F> = F extends SpawnableFunction<
  infer Args,
  infer _E,
  infer _Data,
  infer _Render
>
  ? SpawnableDefinition<string, Args>
  : never
