import type { Except } from 'type-fest'
import { z } from 'zod'
import { TransformSchema } from '~/math/transform.js'
import type {
  LooseTransform,
  TrackedTransform,
  Transform,
} from '~/math/transform.js'
import type { SpawnableFunction, UID } from '~/spawnable/spawnableEntity.js'
import type { Ref } from '~/utils/ref.js'

export interface SpawnableDefinition<
  Name extends string = string,
  Args extends Record<string, unknown> = Record<string, unknown>,
> {
  entity: Name
  args: Args
  transform: Transform
  uid?: UID
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
  uid?: UID
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

export interface SpawnableContext<
  Name extends string = string,
  Args extends Record<string, unknown> = Record<string, unknown>,
> extends Except<
    Required<SpawnableDefinition>,
    'args' | 'entity' | 'label' | 'transform'
  > {
  label: string | undefined
  transform: TrackedTransform
  preview: boolean
  definition: SpawnableDefinition<Name, Args>
  selected: Ref<boolean>
}

export type InferDefinition<F> = F extends SpawnableFunction<
  infer Args,
  infer _E,
  infer _Data,
  infer _Render
>
  ? SpawnableDefinition<string, z.infer<Args>>
  : never
