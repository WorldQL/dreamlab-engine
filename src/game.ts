import { Composite, Engine } from 'matter-js'
import type { Application, IApplicationOptions } from 'pixi.js'
import { dataManager } from '~/entity.js'
import type { Entity, RenderContext } from '~/entity.js'

interface Game {
  instantiate<Data, Render, E extends Entity<Data, Render>>(
    entity: E,
  ): Promise<void>

  destroy<Data, Render, E extends Entity<Data, Render>>(
    entity: E,
  ): Promise<void>

  shutdown(): Promise<void>
}

interface HeadlessOptions {
  headless: true
  container?: never
  graphicsOptions?: never
}

interface NotHeadlessOptions {
  headless: false
  container: HTMLDivElement
  graphicsOptions?: Partial<IApplicationOptions>
}

interface CommonOptions {
  /**
   * Physics Tickrate in Hz [default: 60]
   */
  physicsTickrate?: number
}

type Options = CommonOptions & (HeadlessOptions | NotHeadlessOptions)
export const createGame = async ({
  headless,
  container,
  graphicsOptions,
  physicsTickrate = 60,
}: Options): Promise<Game> => {
  type RenderContextExt = RenderContext & { app: Application }
  const initRenderContext = async (): Promise<RenderContextExt | undefined> => {
    if (headless) return undefined

    const PIXI = await import('pixi.js')
    const app = new PIXI.Application({
      ...graphicsOptions,

      resizeTo: container,
      autoDensity: true,
    })

    app.stage.sortableChildren = true
    const canvas = app.view as HTMLCanvasElement

    const ctx: RenderContextExt = {
      app,
      stage: app.stage,
      canvas,
      container,
    }

    return ctx
  }

  const physics = Engine.create()
  physics.gravity.scale *= 3

  const renderContext = await initRenderContext()
  const entities: Entity[] = []

  const physicsTickDelta = 1_000 / physicsTickrate
  let time = performance.now()
  let physicsTickAcc = 0

  const onTick = async () => {
    const now = performance.now()
    const delta = now - time

    time = now
    physicsTickAcc += delta

    while (physicsTickAcc >= physicsTickDelta) {
      physicsTickAcc -= physicsTickDelta
      Engine.update(physics, physicsTickDelta)

      // const timeState = { delta: physicsTickDelta / 1_000, time: time / 1_000 }
      for (const entity of entities) {
        if (typeof entity.onPhysicsStep !== 'function') continue

        const data = dataManager.getData(entity)
        entity.onPhysicsStep(data)
      }
    }

    if (!renderContext) return
    for (const entity of entities) {
      if (typeof entity.onRenderFrame !== 'function') continue

      const data = dataManager.getData(entity)
      const render = dataManager.getRenderData(entity)

      entity.onRenderFrame(data, render)
    }
  }

  if (renderContext) {
    const { app } = renderContext

    app.ticker.add(onTick)
    app.start()
  } else {
    // TODO: setInterval tick loop
  }

  const game: Game = {
    async instantiate(entity) {
      const data = await entity.init({ physics })
      dataManager.setData(entity, data)

      if (renderContext) {
        const { app: _, ...ctx } = renderContext

        const render = await entity.initRenderContext(ctx)
        dataManager.setRenderData(entity, render)
      }

      entities.push(entity)
    },

    async destroy(entity) {
      const idx = entities.indexOf(entity)

      if (idx === -1) return
      entities.splice(idx, 1)

      if (renderContext) {
        const render = dataManager.getRenderData(entity)
        await entity.teardownRenderContext(render)
      }

      const data = dataManager.getData(entity)
      await entity.teardown(data)
    },

    async shutdown() {
      const jobs = entities.map(async entity => this.destroy(entity))
      await Promise.all(jobs)

      Composite.clear(physics.world, false, true)
      Engine.clear(physics)

      if (renderContext) {
        const { app } = renderContext

        app.stop()
        app.destroy()
      }
    },
  }

  return game
}
