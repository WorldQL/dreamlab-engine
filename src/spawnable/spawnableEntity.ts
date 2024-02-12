import type { Path } from 'dot-path-value'
import type { LiteralUnion } from 'type-fest'
import type { z, ZodObject } from 'zod'
import { Entity, symbol as entitySymbol } from '~/entity'
import type { Bounds } from '~/math/bounds'
import type { TrackedTransform } from '~/math/transform'
import type { Vector } from '~/math/vector'
import type { SpawnableDefinition } from '~/spawnable/definition'
import type { Ref } from '~/utils/ref'

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type ZodObjectAny = ZodObject<any, z.UnknownKeysParam>

export interface SpawnableContext<T extends SpawnableEntity> {
  uid: string
  transform: TrackedTransform
  label: string | undefined
  tags: string[]
  preview: boolean
  selected: Ref<boolean>

  args: T extends SpawnableEntity<infer Args> ? z.infer<Args> : never
  definition: T extends SpawnableEntity<infer Args>
    ? SpawnableDefinition<z.infer<Args>>
    : never
}

export type ArgsPath<Args extends ZodObjectAny> = LiteralUnion<
  Path<z.infer<Args>>,
  string
>
export type PreviousArgs<Args extends ZodObjectAny> = z.infer<Args>

const symbol = Symbol.for('@dreamlab/core/spawnable-entity')
export abstract class SpawnableEntity<
  // NOTE: We should investigate better ergonomics around generic args
  // Ideally we want to infer the generic from a class property but I dont
  // think thats even possible in TypeScript
  // Also we have to contend with constructor arg generics :(
  Args extends ZodObjectAny = ZodObjectAny,
> extends Entity {
  // TODO: Write TSDoc for all methods and properties

  public readonly [symbol] = true as const

  public readonly uid: string
  public readonly transform: TrackedTransform
  public readonly label: string | undefined
  public readonly tags: string[]
  public readonly preview: boolean
  public readonly selected: Ref<boolean>

  public readonly args: z.infer<Args>
  public readonly definition: SpawnableDefinition<z.infer<Args>>

  // NOTE: We need this to be static to be able to reference it before instantiating
  // But we cannot have static generic types
  public static readonly argsSchema: ZodObjectAny // T

  // NOTE: Current design assumes the first constructor arg is always the context
  // Is this the best way of doing it? We want to enforce setting uid/transform/etc properties in
  // the constructor so I dont think a separate factory method is the best way of going about it.
  // We could go into unsafe-land and manually set them (or just a context property) on instantiation
  // but that would require a lot of // @ts-expect-error to make TS happy
  public constructor(ctx: SpawnableContext<SpawnableEntity<Args>>) {
    super()

    this.uid = ctx.uid
    this.transform = ctx.transform
    this.label = ctx.label
    this.tags = ctx.tags
    this.preview = ctx.preview
    this.selected = ctx.selected

    this.args = ctx.args
    this.definition = ctx.definition
  }

  public abstract aabb(): Bounds | undefined
  public abstract isPointInside(point: Vector): boolean

  public onClick(position: Vector): void {
    void position
  }

  public onArgsUpdate(
    path: ArgsPath<Args>,
    previousArgs: PreviousArgs<Args>,
  ): void {
    void path
    void previousArgs
  }

  public onResize(bounds: Bounds): void {
    void bounds
  }
}

/**
 * Type guard to check if an object is of type {@link SpawnableEntity}
 */
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

export type SpawnableConstructor<Args extends ZodObjectAny = ZodObjectAny> =
  new (ctx: SpawnableContext<SpawnableEntity<Args>>) => SpawnableEntity<Args>
