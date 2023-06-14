import type { Except } from 'type-fest'
import { z } from 'zod'
import { TransformSchema } from '~/math/transform.js'
import type { LooseTransform, Transform } from '~/math/transform.js'
import { lookupSpawnableFn } from '~/spawnable/spawn.js'
import type { SpawnableFunction, UID } from '~/spawnable/spawnableEntity.js'

const EntityFunctionSchema = z.string().refine(
  name => lookupSpawnableFn(name) !== undefined,
  name => ({ message: `unknown entityFn: ${name}` }),
)

export interface SpawnableDefinition<
  Name extends string = string,
  Args extends unknown[] = unknown[],
> {
  entityFn: Name
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
  entityFn: Name
  args: Args
  transform: LooseTransform
  uid?: UID
  tags?: string[]
  zIndex?: number
}

export const SpawnableDefinitionSchema = z.object({
  entityFn: EntityFunctionSchema,
  args: z.any().array(),
  transform: TransformSchema,
  uid: z.string().cuid2().optional(),
  tags: z.string().array().optional(),
  zIndex: z.number().optional(),
}) as z.ZodType<SpawnableDefinition>

export interface SpawnableContext<
  Name extends string = string,
  Args extends unknown[] = unknown[],
> extends Except<Required<SpawnableDefinition>, 'args' | 'entityFn'> {
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
