import type { Container } from 'pixi.js'
import type { Promisable as Awaitable, Except } from 'type-fest'
import type { Camera } from '~/entities/camera.js'
import type { Game } from '~/game.js'
import type { Physics } from '~/physics.js'
import { mergeObjects } from '~/utils/types.js'

export interface Time {
  delta: number
  time: number
}

export interface RenderTime extends Time {
  smooth: number
}

export interface InitContext {
  game: Game<boolean>
  physics: Physics
}

export interface InitContextClient extends Except<InitContext, 'game'> {
  game: Game<false>
}

export interface RenderContext {
  container: HTMLDivElement
  canvas: HTMLCanvasElement

  stage: Container
  camera: Camera
}

export const symbol = Symbol.for('@dreamlab/core/entity')
export interface Entity<Data = unknown, Render = unknown> {
  get [symbol](): true
  readonly priority?: number

  init(init: InitContext): Awaitable<Data>
  initRenderContext(
    init: InitContextClient,
    render: RenderContext,
  ): Awaitable<Render>

  onPhysicsStep?(time: Time, data: Data): void
  onRenderFrame?(time: RenderTime, data: Data, render: Render): void

  teardownRenderContext(render: Render): Awaitable<void>
  teardown(data: Data): Awaitable<void>
}

type PartialFields = typeof symbol
export type Partialize<E extends Entity<Data, Render>, Data, Render> = Except<
  E,
  PartialFields
>

export const createEntity = <E extends Entity<Data, Render>, Data, Render>(
  partial: Partialize<E, Data, Render>,
): E => {
  const getter: Pick<E, PartialFields> = {
    get [symbol]() {
      return true as const
    },
  }

  return mergeObjects(partial, getter) as E
}

export const isEntity = (entity: unknown): entity is Entity => {
  if (entity === null) return false
  if (typeof entity === 'undefined') return false
  if (typeof entity !== 'object') return false

  return symbol in entity && entity[symbol] === true
}

const symbols = {
  data: Symbol.for('@dreamlab/core/entity/data'),
  render: Symbol.for('@dreamlab/core/entity/render-data'),
} as const

export const dataManager = {
  getData<E extends Entity<Data>, Data>(
    entity: E | Partialize<E, Data, unknown>,
  ): Data {
    if (!(symbols.data in entity)) {
      throw new Error('invalid entity data access')
    }

    // @ts-expect-error Meta Property
    return entity[symbols.data]
  },

  setData<Data>(entity: Entity<Data>, data: Data): void {
    // @ts-expect-error Meta Property
    entity[symbols.data] = data
  },

  getRenderData<E extends Entity<unknown, Render>, Render>(
    entity: E | Partialize<E, unknown, Render>,
  ): Render {
    if (!(symbols.render in entity)) {
      throw new Error('invalid entity render data access')
    }

    // @ts-expect-error Meta Property
    return entity[symbols.render]
  },

  setRenderData<Render>(entity: Entity<unknown, Render>, render: Render): void {
    // @ts-expect-error Meta Property
    entity[symbols.render] = render
  },
} as const
