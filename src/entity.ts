import type { Engine } from 'matter-js'
import type { Container } from 'pixi.js'
import type { Promisable as Awaitable } from 'type-fest'

// export interface Time {
//   delta: number
//   time: number
// }

// export interface Render {
//   offset: Vector
//   scale: ScaleFactor
//   inverseScale: number
//   debug: boolean
// }

export interface InitContext {
  physics: Engine
}

export interface RenderContext {
  container: HTMLDivElement
  canvas: HTMLCanvasElement

  stage: Container
  // camera: Camera
}

export interface Entity<Data = unknown, Render = unknown> {
  init(init: InitContext): Awaitable<Data>
  initRenderContext(init: RenderContext): Awaitable<Render>

  onPhysicsStep?(data: Data): void
  onRenderFrame?(data: Data, render: Render): void

  teardownRenderContext(render: Render): Awaitable<void>
  teardown(data: Data): Awaitable<void>
}
