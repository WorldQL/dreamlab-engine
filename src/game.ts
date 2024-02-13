import '~/_internal/symbols'

import cuid2 from '@paralleldrive/cuid2'
import { setProperty } from 'dot-prop'
import Matter from 'matter-js'
import onChange from 'on-change'
import { Application } from 'pixi.js'
import type { IApplicationOptions } from 'pixi.js'
import { getGlobalGame, setGlobalGame } from '~/_internal/global-state'
import { Camera } from '~/entities/camera.js'
import { isNetPlayer } from '~/entities/player'
import { registerDefaultSpawnables } from '~/entities/spawnable/index.js'
import { isEntity } from '~/entity.js'
import type { Entity, InitContext, InitRenderContext } from '~/entity.js'
import { createEventsManager } from '~/events.js'
import type { EventsManager } from '~/events.js'
import { InputManager } from '~/input/manager.js'
import type { Bounds } from '~/math/bounds.js'
import { isTrackedTransform, trackTransform } from '~/math/transform.js'
import { v } from '~/math/vector.js'
import type { LooseVector } from '~/math/vector.js'
import type { BareNetClient, NetClient } from '~/network/client'
import type { BareNetServer, NetServer } from '~/network/server'
import { isSyncedValue } from '~/network/sync.js'
import { createPhysics } from '~/physics.js'
import type { Physics } from '~/physics.js'
import type { ClientData } from '~/sdk/clientData.js'
import type { KvStore } from '~/sdk/kv.js'
import { SpawnableDefinitionSchema } from '~/spawnable/definition.js'
import type { LooseSpawnableDefinition } from '~/spawnable/definition.js'
import { isSpawnableEntity } from '~/spawnable/spawnableEntity'
import type {
  SpawnableConstructor,
  SpawnableContext,
  SpawnableEntity,
  ZodObjectAny,
} from '~/spawnable/spawnableEntity'
import { createClientUI } from '~/ui.js'
import type { UIManager } from '~/ui.js'
import { createDebug } from '~/utils/debug.js'
import type { Debug } from '~/utils/debug.js'
import { clone } from '~/utils/object.js'
import { ref } from '~/utils/ref.js'

// #region Options
interface ClientOptions {
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

  /**
   * Additional well-known data for the current client
   */
  data: ClientData

  // Server Options
  kv?: never
}

interface ServerOptions {
  /**
   * Key-Value Store
   */
  kv: KvStore

  // Client options
  container?: never
  dimensions?: never
  graphicsOptions?: never
  data?: never
}

interface CommonOptions<Server extends boolean> {
  /**
   * Run the game in server mode, disabling any rendering logic
   */
  isServer: Server

  /**
   * Physics Tickrate in Hz
   *
   * @defaultValue 60
   */
  physicsTickrate?: number

  /**
   * Debug mode
   */
  debug?: boolean
}

type Options<Server extends boolean> = CommonOptions<Server> &
  (Server extends true ? ServerOptions : ClientOptions)
// #endregion

// #region Render Context Setup
type RenderContextExt = InitRenderContext & { app: Application }
async function initRenderContext<Server extends boolean>(
  options: Options<Server>,
): Promise<Server extends false ? RenderContextExt : undefined>
async function initRenderContext<Server extends boolean>(
  options: Options<Server>,
): Promise<RenderContextExt | undefined> {
  if (options.isServer === true) return undefined
  const { container, dimensions, graphicsOptions } = options as Options<false>

  const app = new Application({
    ...graphicsOptions,

    resizeTo: container,
    autoDensity: true,
  })

  app.stage.sortableChildren = true
  const canvas = app.view as HTMLCanvasElement

  const camera = new Camera(dimensions.width, dimensions.height, canvas)
  const ctx: RenderContextExt = {
    app,
    stage: app.stage,
    canvas,
    container,
    camera,
  }

  return ctx
}
// #endregion

// #region Game Interface
interface GameClient {
  get ui(): UIManager
  get inputs(): InputManager
  get render(): RenderContextExt
  get network(): NetClient | undefined
  get data(): ClientData
}

interface GameServer {
  get kv(): KvStore
  get network(): NetServer | undefined
}

export interface Game<Server extends boolean> {
  get debug(): Debug
  get physics(): Physics
  get events(): EventsManager<Server>

  get client(): Server extends true ? undefined : GameClient
  get server(): Server extends true ? GameServer : undefined

  /**
   * List of all entities
   */
  get entities(): readonly Entity[]

  /**
   * Get a map of all registered spawnable entities
   */
  get registered(): readonly (readonly [
    name: string,
    fn: SpawnableConstructor,
    argsSchema: ZodObjectAny,
  ])[]

  /**
   * Initialize the network interface
   */
  initNetwork(
    network: Server extends true ? BareNetServer : BareNetClient,
  ): void

  /**
   * Register a spawnable function with this game instance
   *
   * @param name - Entity name
   * @param spawnableFn - Spawnable Function
   */
  register<Args extends ZodObjectAny>(
    name: string,
    spawnableFn: SpawnableConstructor<Args>,
    argsSchema: Args,
  ): void

  /**
   * Instantiate an entity
   *
   * @param entity - Entity
   */
  instantiate<E extends Entity>(entity: E): Promise<void>

  /**
   * Destroy an entity
   *
   * @param entity - Entity
   */
  destroy<E extends Entity>(entity: E): Promise<void>

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
   * Spawn multiple entities in one go
   *
   * @param definitions - Entity Definitions
   */
  spawnMany(
    ...definitions: LooseSpawnableDefinition[]
  ): Promise<SpawnableEntity[]>

  /**
   * Issue a resize call to a spawnable entity
   *
   * @param entity - Spawnable Entity
   * @param size - New Size
   * @returns A boolean representing whether the entity supports resizing
   */
  resize(entity: SpawnableEntity, size: Bounds): boolean

  /**
   * Lookup a spawnable entity by UID
   *
   * @param uid - Entity UID
   */
  lookup(uid: string): SpawnableEntity | undefined

  /**
   * Query spawnable entities at a single point
   *
   * @param position - Position to query
   */
  queryPosition(position: LooseVector): SpawnableEntity[]

  /**
   * Query spawnable entities by tag
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
   * Destroy all entities and stop all game logic
   */
  shutdown(): Promise<void>

  [Symbol.asyncDispose](): Promise<void>
}
// #endregion

/**
 * Create a new instance of a Dreamlab Game
 *
 * @param options - Game context options
 */
export async function createGame<Server extends boolean>(
  options: Options<Server>,
): Promise<Game<Server>> {
  if (getGlobalGame() !== undefined) {
    throw new Error('Only one instance of Dreamlab may be created at a time')
  }

  // Set this immediately so race conditions don't occur
  setGlobalGame('pending')

  const debug = createDebug(options.debug ?? false)
  const { physicsTickrate = 60 } = options

  const physics = createPhysics()
  physics.engine.gravity.scale *= 3

  const renderContext = await initRenderContext(options)
  const entities: Entity[] = []
  const spawnables = new Map<string, SpawnableEntity>()
  const spawnableFunctions = new Map<
    string,
    [SpawnableConstructor, ZodObjectAny]
  >()

  const inputs = renderContext ? new InputManager(renderContext) : undefined
  const unregister = inputs?.registerListeners()

  const onClick = (ev: MouseEvent) => {
    if (!renderContext) return

    const { camera } = renderContext
    const pos = camera.screenToWorld({ x: ev.offsetX, y: ev.offsetY })

    // eslint-disable-next-line @typescript-eslint/no-use-before-define
    const entities = game.queryPosition(pos)
    for (const entity of entities) {
      if (typeof entity.onClick !== 'function') continue
      entity.onClick(pos)
    }
  }

  if (renderContext) {
    const { canvas } = renderContext
    canvas.addEventListener('click', onClick)
  }

  const physicsTickDelta = 1_000 / physicsTickrate
  let time = performance.now()
  let physicsTickAcc = 0

  const events = createEventsManager(options.isServer)
  let network: (Server extends true ? NetServer : NetClient) | undefined

  // #region Collision Events
  const onCollision = (
    type: 'active' | 'end' | 'start',
    ev: Matter.IEventCollision<Matter.Engine>,
  ) => {
    const testSpawnables = (pair: Matter.Pair) => {
      const a = physics.getEntity(pair.bodyA)
      const b = physics.getEntity(pair.bodyB)
      if (!a || !b) return

      if (type === 'start') {
        events.common.emit('onCollisionStart', [a, b], pair.collision)
      } else if (type === 'end') {
        events.common.emit('onCollisionEnd', [a, b], pair.collision)
      } else {
        events.common.emit('onCollisionActive', [a, b], pair.collision)
      }
    }

    const testPlayer = (pair: Matter.Pair) => {
      if (!events.client) return

      const player =
        physics.getPlayer(pair.bodyA) ??
        physics.getPlayer(pair.bodyB) ??
        undefined

      if (!player) return
      const other = physics.isPlayer(pair.bodyA) ? pair.bodyB : pair.bodyA

      if (type === 'start') {
        events.client.emit(
          'onPlayerCollisionStart',
          [player, other],
          pair.collision,
        )
      } else if (type === 'end') {
        events.client.emit(
          'onPlayerCollisionEnd',
          [player, other],
          pair.collision,
        )
      } else {
        events.client.emit(
          'onPlayerCollisionActive',
          [player, other],
          pair.collision,
        )
      }
    }

    for (const pair of ev.pairs) {
      testSpawnables(pair)
      testPlayer(pair)
    }
  }

  type CollisionEvent = (ev: Matter.IEventCollision<Matter.Engine>) => void
  const onCollisionStart: CollisionEvent = ev => onCollision('start', ev)
  const onCollisionActive: CollisionEvent = ev => onCollision('active', ev)
  const onCollisionEnd: CollisionEvent = ev => onCollision('end', ev)

  Matter.Events.on(physics.engine, 'collisionStart', onCollisionStart)
  Matter.Events.on(physics.engine, 'collisionActive', onCollisionActive)
  Matter.Events.on(physics.engine, 'collisionEnd', onCollisionEnd)
  // #endregion

  // #region Tick Loop
  const onTick = async () => {
    const now = performance.now()
    const delta = now - time

    time = now
    physicsTickAcc += delta

    // 2s time between frames
    if (renderContext && physicsTickAcc >= 2_000) {
      console.warn(
        `unusually long physicsTickAcc, was ${physicsTickAcc} setting it to zero`,
      )
      events.common.emit('onTickSkipped')
      physicsTickAcc = 0
      return
    }

    while (physicsTickAcc >= physicsTickDelta) {
      physicsTickAcc -= physicsTickDelta

      Matter.Engine.update(physics.engine, physicsTickDelta)

      const timeState = {
        delta: physicsTickDelta / 1_000,
        time: time / 1_000,
      }

      events.common.emit('onPhysicsStep', timeState)

      for (const entity of entities) {
        if (typeof entity.onPhysicsStep !== 'function') continue
        if (isSpawnableEntity(entity) && physics.isFrozen(entity)) continue

        entity.onPhysicsStep(timeState)
      }
    }

    if (renderContext) {
      // @ts-expect-error Private access
      inputs!.updateCursor()

      const smooth = physicsTickAcc / physicsTickDelta
      const timeState = { delta: delta / 1_000, time: time / 1_000, smooth }
      events.client!.emit('onRenderFrame', timeState)

      for (const entity of entities) {
        if (typeof entity.onRenderFrame !== 'function') continue

        if (isSpawnableEntity(entity) && physics.isFrozen(entity)) {
          entity.onRenderFrame({ ...timeState, smooth: 0 })
        } else {
          entity.onRenderFrame(timeState)
        }
      }
    }

    const endOfTickNow = performance.now()
    const endOfTickDelta = endOfTickNow - now
    if (endOfTickDelta > 17) {
      console.warn(
        'Tick took: ' +
          (endOfTickNow - now) +
          'ms. Should take less than 16ms.',
      )
    }
  }

  let interval: NodeJS.Timeout | undefined
  if (renderContext) {
    const { app } = renderContext

    app.ticker.add(onTick)
    app.start()
  } else {
    interval = setInterval(onTick, 1_000 / physicsTickrate / 2)
  }
  // #endregion

  const sortEntities = () => {
    entities.sort((a, b) => (a.priority ?? 0) - (b.priority ?? 0))
  }

  // #region Client / Server Data
  const ui =
    options.container === undefined
      ? undefined
      : createClientUI(options.container)

  const clientData: GameClient | undefined = options.isServer
    ? undefined
    : {
        get ui() {
          return ui as UIManager
        },
        get inputs() {
          return inputs as InputManager
        },
        get render() {
          return renderContext as RenderContextExt
        },
        get network() {
          return network as NetClient | undefined
        },
        get data() {
          return options.data as ClientData
        },
      }

  const serverData: GameServer | undefined = !options.isServer
    ? undefined
    : {
        kv: Object.freeze(options.kv) as KvStore,
        get network() {
          return network as NetServer | undefined
        },
      }
  // #endregion

  const game: Game<Server> = {
    get debug() {
      return debug
    },

    get physics() {
      return physics
    },

    get events() {
      return events
    },

    get client() {
      if (options.isServer || clientData === undefined) {
        return undefined as Server extends true ? undefined : GameClient
      }

      return clientData as Server extends true ? undefined : GameClient
    },

    get server() {
      if (!options.isServer || serverData === undefined) {
        return undefined as Server extends true ? GameServer : undefined
      }

      return serverData as Server extends true ? GameServer : undefined
    },

    get entities() {
      return [...entities]
    },

    get registered() {
      return [...spawnableFunctions.entries()].map(
        ([name, [fn, args]]) => [name, fn, args] as const,
      )
    },

    initNetwork(net) {
      const type = options.isServer ? 'server' : 'client'
      network = { type, ...net } as Server extends true ? NetServer : NetClient
    },

    register(name, spawnableFn, argsSchema) {
      if (spawnableFunctions.has(name)) {
        throw new Error(`duplicate spawnable function: ${name}`)
      }

      const fn = spawnableFn as unknown as SpawnableConstructor

      spawnableFunctions.set(name, [fn, argsSchema])
      events.common.emit('onRegister', name, fn)
    },

    async instantiate(entity) {
      if (!isEntity(entity)) {
        throw new Error('not an entity')
      }

      const init: InitContext = {
        game: this,
        physics,
      }

      await entity.init(init)

      if (renderContext) {
        const { app: _, ...ctx } = renderContext
        await entity.initRender(ctx)
      }

      entities.push(entity)
      sortEntities()

      events.common.emit('onInstantiate', entity)
      if (isNetPlayer(entity)) events.common.emit('onPlayerJoin', entity)
    },

    async destroy(entity) {
      if (!isEntity(entity)) {
        throw new Error('not an entity')
      }

      if (isSpawnableEntity(entity)) {
        if (isTrackedTransform(entity.transform)) {
          entity.transform.removeAllListeners()
        }

        const syncedValues = Object.values(entity).filter(isSyncedValue)
        for (const value of syncedValues) {
          value.destroy()
        }

        onChange.unsubscribe(entity.definition.args)
        onChange.unsubscribe(entity.definition)
        spawnables.delete(entity.uid)
      }

      const idx = entities.indexOf(entity)
      if (idx === -1) return

      entities.splice(idx, 1)
      sortEntities()

      if (renderContext) await entity.teardownRender()
      await entity.teardown()

      events.common.emit('onDestroy', entity)
      if (isNetPlayer(entity)) events.common.emit('onPlayerLeave', entity)
    },

    async spawn(loose, preview = false) {
      const definition = SpawnableDefinitionSchema.parse(loose)
      const spawnable = spawnableFunctions.get(definition.entity)

      if (spawnable === undefined) {
        console.warn(`unknown spawnable function: ${definition.entity}`)
        return undefined
      }

      const [Spawnable, argsSchema] = spawnable

      // Assign unique identifier
      const uid = definition.uid ?? cuid2.createId()
      if (spawnables.has(uid)) {
        throw new Error('entity already spawned')
      }

      // Verify args schema
      const args = argsSchema.parse(definition.args)
      definition.args = args

      // Track changes to args and trigger entity callback
      const watchedArgs = onChange(
        args,
        (pathArray, value, previous) => {
          const entity = this.lookup(uid)
          if (!entity || typeof entity.onArgsUpdate !== 'function') return

          const path = pathArray.reduce<string>((acc, value) => {
            if (typeof value === 'symbol') {
              return `${acc}[${String(value)}]`
            }

            const idx = Number.parseInt(value, 10)
            if (!Number.isNaN(idx)) {
              return `${acc}[${idx}]`
            }

            return acc === '' ? value : `${acc}.${value}`
          }, '')

          const previousArgs = clone(args)
          setProperty(previousArgs, path, previous)

          entity.onArgsUpdate(path, previousArgs)
          events.common.emit('onArgsChanged', entity)

          if (network?.type !== 'client') return
          void network.sendArgsUpdate(uid, path, value)
        },
        { pathAsArray: true },
      )

      // Automatically track transform for the definition
      const transform = trackTransform(definition.transform)
      definition.transform = transform

      const syncTransform = (sync: boolean) => {
        if (sync) return
        if (network?.type !== 'client') return
        void network.sendTransformUpdate(uid, transform)
      }

      transform.addListener(syncTransform)

      // Automatically track tags and label
      const trackedDefinition = onChange(definition, path => {
        const entity = this.lookup(uid)
        if (!entity) return
        events.common.emit('onDefinitionChanged', entity)

        if (network?.type !== 'client') return
        if (path.startsWith('tags')) {
          void network.sendTagsUpdate(uid, definition.tags)
        } else if (path.startsWith('label')) {
          void network.sendLabelUpdate(uid, definition.label)
        }
      })

      const selected = ref(false)
      const context: SpawnableContext<SpawnableEntity> = {
        uid,
        transform,
        label: trackedDefinition.label,
        tags: trackedDefinition.tags,
        args: watchedArgs,

        preview,
        definition: trackedDefinition,
        selected,
      }

      const _entity = new Spawnable(context)
      const entity = Object.assign(_entity, { _selected: selected })

      await this.instantiate(entity)
      spawnables.set(entity.uid, entity)

      events.common.emit('onSpawn', entity)
      return entity
    },

    async spawnMany(...definitions) {
      const jobs = definitions.map(async def => this.spawn(def, false))
      const entities = await Promise.all(jobs)

      return entities.filter(
        (entity): entity is SpawnableEntity => entity !== undefined,
      )
    },

    resize(entity, size) {
      if (size.width < 1 || size.height < 1) {
        throw new Error('size width and height must be >= 1')
      }

      if (typeof entity.onResize !== 'function') return false
      entity.onResize(size)

      return true
    },

    // #region Query Functions
    lookup(uid) {
      return spawnables.get(uid)
    },

    queryPosition(position) {
      const pos = v(position)
      return [...spawnables.values()].filter(
        entity => !entity.preview && entity.isPointInside(pos),
      )
    },

    queryTags(query, fnOrTags) {
      if (query === 'fn') {
        if (typeof fnOrTags !== 'function') {
          throw new TypeError('`fn` must be a function')
        }

        return [...spawnables.values()].filter(entity =>
          fnOrTags(entity.definition.tags),
        )
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
          return fnOrTags.every(tag => entity.definition.tags.includes(tag))
        }

        if (query === 'any') {
          return fnOrTags.some(tag => entity.definition.tags.includes(tag))
        }

        return false
      })
    },

    queryType(fn) {
      return [...spawnables.values()].find(fn)
    },

    queryTypeAll(fn) {
      return [...spawnables.values()].filter(fn)
    },
    // #endregion

    async shutdown() {
      unregister?.()

      const jobs = entities.map(async entity => this.destroy(entity))
      await Promise.all(jobs)

      Matter.Events.off(physics.engine, 'collisionStart', onCollisionStart)
      Matter.Events.off(physics.engine, 'collisionEnd', onCollisionEnd)

      Matter.Composite.clear(physics.world, false, true)
      Matter.Engine.clear(physics.engine)

      if (renderContext) {
        const { app, canvas } = renderContext

        app.stop()
        app.destroy()
        canvas.removeEventListener('click', onClick)
      }

      if (interval) clearInterval(interval)
      setGlobalGame(undefined)
    },

    async [Symbol.asyncDispose](): Promise<void> {
      await this.shutdown()
    },
  }

  setGlobalGame(game)

  registerDefaultSpawnables(game)
  if (renderContext) await game.instantiate(renderContext.camera)

  return game
}
