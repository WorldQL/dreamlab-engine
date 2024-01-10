import type { Path } from 'dot-path-value'
import type { Except } from 'type-fest'
import type { z, ZodObject } from 'zod'
import { symbol as entitySymbol } from '~/entity.js'
import type { Entity } from '~/entity.js'
import type { Bounds } from '~/math/bounds.js'
import type { Transform } from '~/math/transform.js'
import type { Vector } from '~/math/vector.js'
import type {
  SpawnableContext,
  SpawnableDefinition,
} from '~/spawnable/definition.js'
import { mergeObjects } from '~/utils/types.js'

export type UID = string
const symbol = Symbol.for('@dreamlab/core/spawnable-entity')

export interface SpawnableEntity<
  Data = unknown,
  Render = unknown,
  ArgsSchema extends ZodObjectAny = ZodObjectAny,
> extends Entity<Data, Render> {
  get [symbol](): true

  get uid(): UID
  get label(): string | undefined
  get preview(): boolean
  get transform(): Transform
  get definition(): SpawnableDefinition
  get args(): z.infer<ArgsSchema>
  get argsSchema(): ArgsSchema

  onArgsUpdate?<T extends Path<z.infer<ArgsSchema>>>(
    path: T,
    previousArgs: z.infer<ArgsSchema>,
    data: Data,
    render: Render | undefined,
  ): void
  onResize?(bounds: Bounds): void

  rectangleBounds(): Bounds | undefined
  isPointInside(position: Vector): boolean
}

type PartialFields =
  | typeof entitySymbol
  | typeof symbol
  | 'args'
  | 'argsSchema'
  | 'definition'
  | 'label'
  | 'preview'
  | 'transform'
  | 'uid'

export type PartializeSpawnable<
  E extends SpawnableEntity<Data, Render>,
  Data,
  Render,
> = Except<E, PartialFields>

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type ZodObjectAny = ZodObject<any, z.UnknownKeysParam>

type BaseSpawnableFunction<
  ArgsSchema extends ZodObjectAny,
  E extends SpawnableEntity<Data, Render, ArgsSchema>,
  Data,
  Render,
> = (ctx: SpawnableContext, args: z.infer<ArgsSchema>) => E

export interface SpawnableFunction<
  ArgsSchema extends ZodObjectAny,
  E extends SpawnableEntity<Data, Render, ArgsSchema>,
  Data,
  Render,
> extends BaseSpawnableFunction<ArgsSchema, E, Data, Render> {
  argsSchema: ArgsSchema
  hasDefaults: boolean
}

export type BareSpawnableFunction = SpawnableFunction<
  ZodObjectAny,
  SpawnableEntity,
  unknown,
  unknown
>

export const createSpawnableEntity = <
  ArgsSchema extends ZodObjectAny,
  E extends SpawnableEntity<Data, Render, ArgsSchema>,
  Data,
  Render,
>(
  argsSchema: ArgsSchema,
  fn: (
    ctx: SpawnableContext<string, z.infer<ArgsSchema>>,
    args: z.infer<ArgsSchema>,
  ) => PartializeSpawnable<E, Data, Render>,
): SpawnableFunction<ArgsSchema, E, Data, Render> => {
  const spawnFn: BaseSpawnableFunction<ArgsSchema, E, Data, Render> = (
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

      get args() {
        return args
      },

      get [symbol]() {
        return true as const
      },

      get definition() {
        return ctx.definition
      },

      get label() {
        return ctx.definition.label ?? undefined
      },

      get transform() {
        return ctx.transform
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

  const { success: hasDefaults } = argsSchema.safeParse({})
  return Object.assign(spawnFn, { argsSchema, hasDefaults })
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
