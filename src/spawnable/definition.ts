import type { Except } from 'type-fest'
import { z } from 'zod'
import { VectorSchema } from '~/math/vector.js'
import type { Vector } from '~/math/vector.js'
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
  position: Vector
  uid?: UID
  tags?: string[]
  zIndex?: number
}

export const SpawnableDefinitionSchema = z.object({
  entityFn: EntityFunctionSchema,
  args: z.any().array(),
  position: VectorSchema,
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
