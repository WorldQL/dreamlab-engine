import { Composite, Engine } from 'matter-js'
import * as PIXI from 'pixi.js'
import { dataManager } from '~/entity.js'
import type { Entity, RenderContext } from '~/entity.js'

// /* eslint-disable unicorn/no-array-for-each */
// import type { Except } from 'type-fest'
// import type { Camera } from '~/entities/camera'
// import type { Player } from '~/entities/player'
// import type { Context, Entity, EntityCtxFn, GameContext } from '~/entity'
// import { defineEntity } from '~/entity'
// import type { SpawnableDefinition } from '~/spawn.js'
// import type {
//   FullSpawnableEntity,
//   PartialSpawnableContext,
//   PartialSpawnableEntity,
//   SpawnableEntity,
//   SpawnableEntityCtxFn,
//   UUID,
// } from '~/spawnableEntity'
// import type { Vector } from '~/utilities/math'

// export interface Game extends Entity {
//   get player(): Player
//   get camera(): Camera

//   add<E extends Entity, C extends GameContext>(fn: EntityCtxFn<E, C>): E
//   addMany(...fns: EntityCtxFn<Entity, Context>[]): void

//   spawn<E extends PartialSpawnableEntity, C extends GameContext>(
//     fn: SpawnableEntityCtxFn<E, C>,
//     ctx: PartialSpawnableContext,
//     init?: boolean,
//   ): Promise<FullSpawnableEntity<E>>

//   instantiate(
//     definition: SpawnableDefinition,
//     preview?: boolean,
//     init?: boolean,
//   ): Promise<SpawnableEntity | undefined>

//   lookup(uuid: UUID): Entity | undefined
//   queryPosition(position: Vector): SpawnableEntity[]

//   remove<E extends Entity>(entity: E): Promise<void>
// }

// type Args = [
//   player: EntityCtxFn<Player, GameContext>,
//   camera: EntityCtxFn<Camera, Except<Context, 'camera' | 'game'>>,
// ]

// export const createGame = defineEntity<Game, GameContext, Args>(
//   (gameCtx, playerFn, cameraFn) => {
//     const entities: Entity[] = []
//     const spawned = new Map<string, SpawnableEntity>()

//     const player = playerFn(gameCtx)
//     const camera = cameraFn({ ...gameCtx, player })
//     entities.push(player, camera)

//     const ctx: Except<Context, 'game'> = {
//       ...gameCtx,
//       player,
//       camera,
//     }

//     const game: Game = {
//       get player() {
//         return player
//       },

//       get camera() {
//         return camera
//       },

//       add(fn) {
//         const gameCtx: Context = { ...ctx, game: this }

//         // TODO: Fix type hack
//         // @ts-expect-error Context type hack
//         const entity = fn(gameCtx)
//         entities.push(entity)

//         return entity
//       },

//       addMany(...fns) {
//         for (const fn of fns) {
//           this.add(fn)
//         }
//       },

//       async spawn(fn, spawnableCtx, init = true) {
//         const gameCtx: Context = { ...ctx, game: this }

//         // TODO: Fix type hack
//         // @ts-expect-error Context type hack
//         const entity = fn(gameCtx, spawnableCtx)

//         entities.push(entity)
//         spawned.set(entity.uuid, entity)

//         if (init) await entity.onCreate?.()

//         return entity
//       },

//       async instantiate(definition, preview = false, init = true) {
//         const { spawnEntity } = await import('~/spawn')

//         const entityFn = spawnEntity(definition)
//         if (entityFn === undefined) return undefined

//         return this.spawn(
//           entityFn,
//           {
//             uuid: definition.uuid,
//             tags: definition.tags,
//             position: definition.position,
//             zIndex: definition.zIndex,
//             preview,

//             definition,
//           },
//           init,
//         )
//       },

//       lookup(uuid) {
//         return spawned.get(uuid)
//       },

//       queryPosition(position) {
//         return [...spawned.values()].filter(
//           entity => !entity.preview && entity.isInBounds(position),
//         )
//       },

//       async remove(entity) {
//         const { isSpawnable } = await import('~/spawnableEntity')

//         const idx = entities.indexOf(entity)
//         if (idx === -1) return

//         entities.splice(idx, 1)
//         if (isSpawnable(entity)) spawned.delete(entity.uuid)

//         entity.onDestroy?.()
//       },

//       async onCreate(...deps) {
//         await Promise.all(
//           entities.map(async entity => entity.onCreate?.(...deps)),
//         )
//       },

//       onDestroy(...deps) {
//         entities.forEach(entity => entity.onDestroy?.(...deps))
//       },

//       onTick(...deps) {
//         entities.forEach(entity => entity.onTick?.(...deps))
//       },

//       onRender(...deps) {
//         entities.forEach(entity => entity.onRender?.(...deps))
//       },
//     }

//     return game
//   },
// )

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
  graphicsOptions?: Partial<PIXI.IApplicationOptions>
}

interface CommonOptions {
  /**
   * Physics Tickrate in Hz [default: 60]
   */
  physicsTickrate?: number
}

type Options = CommonOptions & (HeadlessOptions | NotHeadlessOptions)
export const createGame = ({
  headless,
  container,
  graphicsOptions,
  physicsTickrate = 60,
}: Options): Game => {
  type RenderContextExt = RenderContext & { app: PIXI.Application }
  const initRenderContext = (): RenderContextExt | undefined => {
    if (headless) return undefined

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

  const renderContext = initRenderContext()
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

  // TODO: Actually call the tick loop

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
