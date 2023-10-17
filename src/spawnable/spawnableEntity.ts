import type { Except } from 'type-fest'
import type { z, ZodObject } from 'zod'
import { symbol as entitySymbol } from '~/entity.js'
import type { Entity } from '~/entity.js'
import type { Transform } from '~/math/transform.js'
import type { Vector } from '~/math/vector.js'
import type {
  SpawnableContext,
  SpawnableDefinition,
} from '~/spawnable/definition.js'
import { mergeObjects } from '~/utils/types.js'

export type UID = string
const symbol = Symbol.for('@dreamlab/core/spawnable-entity')

export interface SpawnableEntity<Data = unknown, Render = unknown>
  extends Entity<Data, Render> {
  get [symbol](): true

  get uid(): UID
  get tags(): string[]
  get preview(): boolean
  get transform(): Transform
  get definition(): SpawnableDefinition
  get argsSchema(): z.ZodSchema

  isInBounds(position: Vector): boolean
}

type PartialFields =
  | typeof entitySymbol
  | typeof symbol
  | 'argsSchema'
  | 'definition'
  | 'preview'
  | 'uid'

export type PartializeSpawnable<
  E extends SpawnableEntity<Data, Render>,
  Data,
  Render,
> = Except<E, PartialFields>

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type ZodObjectAny = ZodObject<any, z.UnknownKeysParam>

export type SpawnableFunction<
  ArgsSchema extends ZodObjectAny,
  E extends SpawnableEntity<Data, Render>,
  Data,
  Render,
> = (ctx: SpawnableContext, args: z.infer<ArgsSchema>) => E

export type BareSpawnableFunction = SpawnableFunction<
  ZodObjectAny,
  SpawnableEntity,
  unknown,
  unknown
>

export const createSpawnableEntity = <
  ArgsSchema extends ZodObjectAny,
  E extends SpawnableEntity<Data, Render>,
  Data,
  Render,
>(
  argsSchema: ArgsSchema,
  fn: (
    ctx: SpawnableContext,
    args: z.infer<ArgsSchema>,
  ) => PartializeSpawnable<E, Data, Render>,
): SpawnableFunction<ArgsSchema, E, Data, Render> => {
  const spawnFn: SpawnableFunction<ArgsSchema, E, Data, Render> = (
    ctx,
    args,
  ) => {
    const partial = fn(ctx, args)
    const getter: Pick<E, PartialFields> = {
      get [entitySymbol]() {
        return true as const
      },

      get argsSchema() {
        return argsSchema
      },

      get [symbol]() {
        return true as const
      },

      get definition() {
        return ctx.definition
      },

      get preview() {
        return ctx.preview
      },

      get uid() {
        return ctx.uid
      },
    }

    return mergeObjects(partial, getter) as E
  }

  return spawnFn
}

export const isSpawnableEntity = (
  entity: unknown,
): entity is SpawnableEntity => {
  if (entity === null) return false
  if (typeof entity === 'undefined') return false
  if (typeof entity !== 'object') return false

  return (
    entitySymbol in entity &&
    entity[entitySymbol] === true &&
    symbol in entity &&
    entity[symbol] === true
  )
}
