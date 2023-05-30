import type { Engine } from 'matter-js'
import type { Container } from 'pixi.js'
import type { Promisable as Awaitable, Except } from 'type-fest'
import type { Game } from '~/game.js'
import { mergeObjects } from '~/utils/types.js'

export interface Time {
  delta: number
  time: number
}

// export interface Render {
//   offset: Vector
//   scale: ScaleFactor
//   inverseScale: number
//   debug: boolean
// }

export interface InitContext {
  game: Game<boolean>
  physics: Engine
}

export interface RenderContext {
  container: HTMLDivElement
  canvas: HTMLCanvasElement

  stage: Container
  // camera: Camera
}

const symbol = Symbol('entity')
export interface Entity<Data = unknown, Render = unknown> {
  get [symbol](): true

  init(init: InitContext): Awaitable<Data>
  initRenderContext(init: RenderContext): Awaitable<Render>

  onPhysicsStep?(time: Time, data: Data): void
  onRenderFrame?(time: Time, data: Data, render: Render): void

  teardownRenderContext(render: Render): Awaitable<void>
  teardown(data: Data): Awaitable<void>
}

export type Partialize<E extends Entity<Data, Render>, Data, Render> = Except<
  E,
  typeof symbol
>

export const createEntity = <E extends Entity<Data, Render>, Data, Render>(
  partial: Partialize<E, Data, Render>,
): E => {
  const getter: Pick<E, typeof symbol> = {
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
  data: Symbol('data'),
  render: Symbol('render data'),
} as const

export const dataManager = {
  getData<Data>(entity: Entity<Data>): Data {
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

  getRenderData<Render>(entity: Entity<unknown, Render>): Render {
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
