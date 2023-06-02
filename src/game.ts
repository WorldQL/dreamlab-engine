import { Composite, Engine } from 'matter-js'
import type { Application, IApplicationOptions } from 'pixi.js'
import { dataManager, isEntity } from '~/entity.js'
import type { Entity, InitContext, RenderContext } from '~/entity.js'
import type { Vector } from '~/math/vector.js'
import type { SpawnableDefinition } from '~/spawnable/definition.js'
import { instantiate } from '~/spawnable/spawn.js'
import { isSpawnableEntity } from '~/spawnable/spawnableEntity.js'
import type { SpawnableEntity, UID } from '~/spawnable/spawnableEntity.js'
import { createDebug } from '~/utils/debug.js'
import type { Debug } from '~/utils/debug.js'

export interface Game<Headless extends boolean> {
  get debug(): Debug
  get render(): Headless extends false ? RenderContextExt : never

  instantiate<Data, Render, E extends Entity<Data, Render>>(
    entity: E,
  ): Promise<void>

  destroy<Data, Render, E extends Entity<Data, Render>>(
    entity: E,
  ): Promise<void>

  spawn(definition: SpawnableDefinition, preview?: boolean): Promise<boolean>
  lookup(uid: UID): SpawnableEntity | undefined
  positionQuery(position: Vector): SpawnableEntity[]

  shutdown(): Promise<void>
}

interface Options<Headless extends Boolean> {
  /**
   * Run the game logic without any rendering code
   */
  headless: Headless

  /**
   * HTML `div` element for the Pixi.js canvas to mount inside
   */
  container: Headless extends false ? HTMLDivElement : never

  /**
   * Additional options to pass to Pixi.js
   */
  graphicsOptions?: Headless extends false
    ? Partial<IApplicationOptions>
    : never

  /**
   * Physics Tickrate in Hz [default: 60]
   */
  physicsTickrate?: number

  /**
   * Debug mode
   */
  debug?: boolean
}

type RenderContextExt = RenderContext & { app: Application }
async function initRenderContext<Headless extends boolean>({
  headless,
  graphicsOptions,
  container,
}: Options<Headless>): Promise<
  Headless extends false ? RenderContextExt : undefined
>
async function initRenderContext<Headless extends boolean>({
  headless,
  graphicsOptions,
  container,
}: Options<Headless>): Promise<RenderContextExt | undefined> {
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

export async function createGame<Headless extends boolean>(
  options: Options<Headless>,
): Promise<Game<Headless>> {
  const debug = createDebug(options.debug ?? false)
  const { physicsTickrate = 60 } = options

  const physics = Engine.create()
  physics.gravity.scale *= 3

  const renderContext = await initRenderContext(options)
  const entities: Entity[] = []
  const spawnables = new Map<string, SpawnableEntity>()

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

      const timeState = { delta: physicsTickDelta / 1_000, time: time / 1_000 }
      for (const entity of entities) {
        if (typeof entity.onPhysicsStep !== 'function') continue

        const data = dataManager.getData(entity)
        entity.onPhysicsStep(timeState, data)
      }
    }

    if (!renderContext) return

    const timeState = { delta: delta / 1_000, time: time / 1_000 }
    for (const entity of entities) {
      if (typeof entity.onRenderFrame !== 'function') continue

      const data = dataManager.getData(entity)
      const render = dataManager.getRenderData(entity)

      entity.onRenderFrame(timeState, data, render)
    }
  }

  if (renderContext) {
    const { app } = renderContext

    app.ticker.add(onTick)
    app.start()
  } else {
    // TODO: setInterval tick loop
  }

  const game: Game<Headless> = {
    get debug() {
      return debug
    },

    get render() {
      if (options.headless === true || renderContext === undefined) {
        throw new Error('cannot get render context in headless mode')
      }

      return renderContext as Headless extends false ? RenderContextExt : never
    },

    async instantiate(entity) {
      if (!isEntity(entity)) {
        throw new Error('not an entity')
      }

      const init: InitContext = {
        game: this,
        physics,
      }

      const data = await entity.init(init)
      dataManager.setData(entity, data)

      if (renderContext) {
        const { app: _, ...ctx } = renderContext

        const render = await entity.initRenderContext(init, ctx)
        dataManager.setRenderData(entity, render)
      }

      entities.push(entity)
    },

    async destroy(entity) {
      if (!isEntity(entity)) {
        throw new Error('not an entity')
      }

      if (isSpawnableEntity(entity)) spawnables.delete(entity.uid)
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

    async spawn(definition, preview) {
      const entity = instantiate(definition, preview)
      if (entity === undefined) return false

      await this.instantiate(entity)
      spawnables.set(entity.uid, entity)

      return true
    },

    lookup(uid) {
      return spawnables.get(uid)
    },

    positionQuery(position) {
      return [...spawnables.values()].filter(
        entity => !entity.preview && entity.isInBounds(position),
      )
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
