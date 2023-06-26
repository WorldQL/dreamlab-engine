import { Composite, Engine } from 'matter-js'
import { Application } from 'pixi.js'
import type { IApplicationOptions } from 'pixi.js'
import { createCamera } from '~/entities/camera.js'
import { dataManager, isEntity } from '~/entity.js'
import type { Entity, InitContext, RenderContext } from '~/entity.js'
import { LevelSchema } from '~/level.js'
import type { Level } from '~/level.js'
import { v } from '~/math/vector.js'
import type { LooseVector } from '~/math/vector.js'
import type { NetClient } from '~/network/client'
import type { NetServer } from '~/network/server'
import { SpawnableDefinitionSchema } from '~/spawnable/definition.js'
import type { LooseSpawnableDefinition } from '~/spawnable/definition.js'
import { instantiate } from '~/spawnable/spawn.js'
import { isSpawnableEntity } from '~/spawnable/spawnableEntity.js'
import type { SpawnableEntity, UID } from '~/spawnable/spawnableEntity.js'
import type { Debug } from '~/utils/debug.js'
import { createDebug } from '~/utils/debug.js'

interface GraphicsOptions {
  /**
   * HTML `div` element for the Pixi.js canvas to mount inside
   */
  container: HTMLDivElement

  /**
   * Desired canvas dimensions
   */
  dimensions: { width: number; height: number }

  /**
   * Additional options to pass to Pixi.js
   */
  graphicsOptions?: Partial<IApplicationOptions>
}

interface HeadlessOptions {
  container?: never
  dimensions?: never
  graphicsOptions?: never
}

interface CommonOptions<Headless extends boolean> {
  /**
   * Run the game without running any rendering logic
   */
  headless: Headless

  /**
   * Physics Tickrate in Hz [default: 60]
   */
  physicsTickrate?: number

  /**
   * Debug mode
   */
  debug?: boolean

  network: Headless extends true ? NetServer : NetClient
}

type Options<Headless extends boolean> = CommonOptions<Headless> &
  (Headless extends true ? HeadlessOptions : GraphicsOptions)

type RenderContextExt = RenderContext & { app: Application }
async function initRenderContext<Headless extends boolean>(
  options: Options<Headless>,
): Promise<Headless extends false ? RenderContextExt : undefined>
async function initRenderContext<Headless extends boolean>(
  options: Options<Headless>,
): Promise<RenderContextExt | undefined> {
  if (options.headless === true) return undefined
  const { container, dimensions, graphicsOptions } = options as Options<false>

  const app = new Application({
    ...graphicsOptions,

    resizeTo: container,
    autoDensity: true,
  })

  app.stage.sortableChildren = true
  const canvas = app.view as HTMLCanvasElement

  const camera = createCamera(dimensions.width, dimensions.height)
  const ctx: RenderContextExt = {
    app,
    stage: app.stage,
    canvas,
    container,
    camera,
  }

  return ctx
}

type TickListener = (delta: number) => Promise<void> | void

export interface Game<Headless extends boolean> {
  get debug(): Debug
  get render(): Headless extends false ? RenderContextExt : never
  get physics(): Engine
  get network(): Headless extends true ? NetServer : NetClient

  /**
   * Instantiate an entity
   *
   * @param entity - Entity
   */
  instantiate<Data, Render, E extends Entity<Data, Render>>(
    entity: E,
  ): Promise<void>

  /**
   * Destroy an entity
   *
   * @param entity - Entity
   */
  destroy<Data, Render, E extends Entity<Data, Render>>(
    entity: E,
  ): Promise<void>

  /**
   * Load many entities from a level definition
   *
   * @param level - Level Definition
   * @returns Array of Spawnable Entity IDs
   */
  load(level: Level): Promise<string[]>

  /**
   * Spawn a new entity
   *
   * @param definition - Entity Definition
   * @param preview - Spawn in Preview mode
   */
  spawn(
    definition: LooseSpawnableDefinition,
    preview?: boolean,
  ): Promise<SpawnableEntity | undefined>

  /**
   * Lookup a spawnable entity by UID
   *
   * @param uid - Entity UID
   */
  lookup(uid: UID): SpawnableEntity | undefined

  /**
   * Query spawnable entities at a single point
   *
   * @param position - Position to query
   */
  queryPosition(position: LooseVector): SpawnableEntity[]

  /**
   * Query spawnable enties by tag
   *
   * @param query - Type of Query
   * @param fn - Tags predicate
   * @param tags - List of tags to check
   */
  queryTags(query: 'fn', fn: (tags: string[]) => boolean): SpawnableEntity[]
  queryTags(query: 'all' | 'any', tags: string[]): SpawnableEntity[]

  /**
   * Query a single spawnable entity with a type predicate
   *
   * @param fn - Type predicate
   */
  queryType<T extends SpawnableEntity = SpawnableEntity>(
    fn: (arg: SpawnableEntity) => arg is T,
  ): T | undefined

  /**
   * Query multiple spawnable entities with a type predicate
   *
   * @param fn - Type predicate
   */
  queryTypeAll<T extends SpawnableEntity = SpawnableEntity>(
    fn: (arg: SpawnableEntity) => arg is T,
  ): T[]

  /**
   * Add a listener function for physics ticks
   *
   * @param listener - Listener Function
   */
  addTickListener(listener: TickListener): void

  /**
   * Remove a tick listener
   *
   * @param listener - Listener Function
   */
  removeTickListener(listener: TickListener): void

  /**
   * Destroy all entities and stop all game logic
   */
  shutdown(): Promise<void>
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

  const tickListeners: Set<TickListener> = new Set()

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

      for (const tickListener of tickListeners) {
        void tickListener(physicsTickDelta)
      }

      const timeState = { delta: physicsTickDelta / 1_000, time: time / 1_000 }
      for (const entity of entities) {
        if (typeof entity.onPhysicsStep !== 'function') continue

        const data = dataManager.getData(entity)
        entity.onPhysicsStep(timeState, data)
      }
    }

    if (renderContext) {
      const timeState = { delta: delta / 1_000, time: time / 1_000 }
      for (const entity of entities) {
        if (typeof entity.onRenderFrame !== 'function') continue

        const data = dataManager.getData(entity)
        const render = dataManager.getRenderData(entity)

        entity.onRenderFrame(timeState, data, render)
      }
    }
  }

  let interval: NodeJS.Timer | undefined
  if (renderContext) {
    const { app } = renderContext

    app.ticker.add(onTick)
    app.start()
  } else {
    interval = setInterval(onTick, 1_000 / physicsTickrate / 2)
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

    get physics() {
      return physics
    },

    get network() {
      return options.network
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

    async load(data) {
      const level = await LevelSchema.parseAsync(data)
      const jobs = level.map(async definition => this.spawn(definition, false))
      const entities = await Promise.all(jobs)

      return entities
        .filter((entity): entity is SpawnableEntity => entity !== undefined)
        .map(entity => entity.uid)
    },

    async spawn(loose, preview) {
      const definition = SpawnableDefinitionSchema.parse(loose)
      const entity = instantiate(definition, preview)
      if (entity === undefined) return undefined

      await this.instantiate(entity)
      spawnables.set(entity.uid, entity)

      return entity
    },

    lookup(uid) {
      return spawnables.get(uid)
    },

    queryPosition(position) {
      const pos = v(position)
      return [...spawnables.values()].filter(
        entity => !entity.preview && entity.isInBounds(pos),
      )
    },

    queryTags(query, fnOrTags) {
      if (query === 'fn') {
        if (typeof fnOrTags !== 'function') {
          throw new TypeError('`fn` must be a function')
        }

        return [...spawnables.values()].filter(entity => fnOrTags(entity.tags))
      }

      if (!Array.isArray(fnOrTags)) {
        throw new TypeError('`tags` must be an array')
      }

      const isStringArray = fnOrTags.every(x => typeof x === 'string')
      if (!isStringArray) {
        throw new TypeError('`tags` must be an array of strings')
      }

      return [...spawnables.values()].filter(entity => {
        if (query === 'all') {
          return fnOrTags.every(tag => entity.tags.includes(tag))
        }

        if (query === 'any') {
          return fnOrTags.some(tag => entity.tags.includes(tag))
        }

        return false
      })
    },

    queryType(fn) {
      // eslint-disable-next-line unicorn/no-array-callback-reference
      return [...spawnables.values()].find(fn)
    },

    queryTypeAll(fn) {
      // eslint-disable-next-line unicorn/no-array-callback-reference
      return [...spawnables.values()].filter(fn)
    },

    addTickListener(listener) {
      tickListeners.add(listener)
    },

    removeTickListener(listener) {
      tickListeners.delete(listener)
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

      if (interval) clearInterval(interval)
    },
  }

  if (renderContext) await game.instantiate(renderContext.camera)

  return game
}
