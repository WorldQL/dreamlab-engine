import Matter from 'matter-js'
import { Container, Graphics } from 'pixi.js'
import type { Sprite } from 'pixi.js'
import { z } from 'zod'
import type { Camera } from '~/entities/camera.js'
import type { Background } from '~/entities/spawnable/background.js'
import { isBackground } from '~/entities/spawnable/background.js'
import type { EventHandler } from '~/events.js'
import type { Game } from '~/game.js'
import { toRadians } from '~/math/general.js'
import { Vec, VectorSchema } from '~/math/vector.js'
import type { Physics } from '~/physics.js'
import { createSpawnableEntity } from '~/spawnable/spawnableEntity.js'
import type { SpawnableEntity } from '~/spawnable/spawnableEntity.js'
import { createSprite } from '~/textures/sprites'
import type { Debug } from '~/utils/debug.js'
import { drawBox } from '~/utils/draw.js'

enum BackgroundActionType {
  Clear = 'clear',
  Keep = 'keep',
  Set = 'set',
}

const BackgroundActionSetSchema = z.object({
  action: z.enum([BackgroundActionType.Set]),
  textureURL: z.string(),
  fadeTime: z.number().min(0.01).optional(),
  scale: VectorSchema.optional(),
  parallax: VectorSchema.optional(),
})

const BackgroundActionClearSchema = z.object({
  action: z.enum([BackgroundActionType.Clear]),
})

const BackgroundActionKeepSchema = z.object({
  action: z.enum([BackgroundActionType.Keep]),
})

export type BackgroundAction = z.infer<typeof BackgroundActionSchema>
const BackgroundActionSchema = z.discriminatedUnion('action', [
  BackgroundActionSetSchema,
  BackgroundActionClearSchema,
  BackgroundActionKeepSchema,
])

type Args = typeof ArgsSchema
const ArgsSchema = z.object({
  width: z.number().positive().min(1).default(30),
  height: z.number().positive().min(1).default(30),

  onEnter: BackgroundActionSchema.default({
    action: BackgroundActionType.Clear,
  }),
  onLeave: BackgroundActionSchema.default({
    action: BackgroundActionType.Clear,
  }),
})

interface Data {
  game: Game<boolean>
  debug: Debug
  physics: Physics

  onPlayerCollisionStart: EventHandler<'onPlayerCollisionStart'>
  onPlayerCollisionEnd: EventHandler<'onPlayerCollisionEnd'>
}

interface Render {
  camera: Camera

  container: Container
  gfx: Graphics
  sprite: Sprite | undefined
}

export const createBackgroundTrigger = createSpawnableEntity<
  Args,
  SpawnableEntity<Data, Render, Args>,
  Data,
  Render
>(ArgsSchema, ({ transform }, args) => {
  let inside = false

  const colour = '#cc87ff'
  const trigger = Matter.Bodies.rectangle(
    transform.position.x,
    transform.position.y,
    args.width,
    args.height,
    {
      label: 'background_trigger',
      render: { visible: false },
      angle: toRadians(transform.rotation),

      isStatic: true,
      isSensor: true,
    },
  )

  return {
    rectangleBounds() {
      return { width: args.width, height: args.height }
    },

    isPointInside(position) {
      return Matter.Query.point([trigger], position).length > 0
    },

    init({ game, physics }) {
      const debug = game.debug
      physics.register(this, trigger)
      physics.linkTransform(trigger, transform)

      const getBackground = async (): Promise<Background> => {
        const existing = game.queryType(isBackground)
        if (existing) return existing

        const spawned = await game.spawn({
          entity: '@dreamlab/Background',
          args: {},
          transform: { position: [0, 0] },
        })

        if (!spawned) {
          throw new Error('failed to spawn background')
        }

        return spawned as Background
      }

      const updateBackground = async (
        action: z.infer<typeof BackgroundActionSchema>,
      ) => {
        const background = await getBackground()
        switch (action.action) {
          case BackgroundActionType.Set: {
            if (action.fadeTime) background.args.fadeTime = action.fadeTime
            if (action.scale) background.args.scale = action.scale
            if (action.parallax) background.args.parallax = action.parallax

            background.args.textureURL = action.textureURL

            break
          }

          case BackgroundActionType.Clear: {
            background.args.textureURL = undefined

            break
          }

          case BackgroundActionType.Keep: {
            // No-op
            break
          }
        }
      }

      const onPlayerCollisionStart: EventHandler<
        'onPlayerCollisionStart'
      > = async ([_player, other]) => {
        if (other !== trigger) return
        inside = true
        await updateBackground(args.onEnter)
      }

      const onPlayerCollisionEnd: EventHandler<
        'onPlayerCollisionEnd'
      > = async ([_player, other]) => {
        if (other !== trigger) return
        inside = false
        await updateBackground(args.onLeave)
      }

      game.events.client?.addListener(
        'onPlayerCollisionStart',
        onPlayerCollisionStart,
      )

      game.events.client?.addListener(
        'onPlayerCollisionEnd',
        onPlayerCollisionEnd,
      )

      return {
        game,
        debug,
        physics,
        onPlayerCollisionStart,
        onPlayerCollisionEnd,
      }
    },

    initRenderContext(_, { stage, camera }) {
      const { width, height } = args

      const container = new Container()
      container.sortableChildren = true
      container.zIndex = transform.zIndex

      const gfx = new Graphics()
      gfx.zIndex = 100
      drawBox(gfx, { width, height }, { stroke: colour })

      const sprite =
        args.onEnter.action === 'set'
          ? createSprite({ url: args.onEnter.textureURL }, { width, height })
          : undefined

      container.addChild(gfx)
      if (sprite) container.addChild(sprite)
      stage.addChild(container)

      transform.addZIndexListener(() => {
        container.zIndex = transform.zIndex
      })

      return { camera, container, gfx, sprite }
    },

    onArgsUpdate(path, previous, _data, render) {
      if (path === 'width' || path === 'height') {
        const { width: originalWidth, height: originalHeight } = previous
        const { width, height } = args

        const scaleX = width / originalWidth
        const scaleY = height / originalHeight

        Matter.Body.setAngle(trigger, 0)
        Matter.Body.scale(trigger, scaleX, scaleY)
        Matter.Body.setAngle(trigger, toRadians(transform.rotation))

        if (render) {
          drawBox(render.gfx, { width, height }, { stroke: colour })

          if (render.sprite) {
            render.sprite.width = width
            render.sprite.height = height
          }
        }
      }

      if (render && path.startsWith('onEnter')) {
        const { width, height } = args

        render.sprite?.destroy()
        render.sprite =
          args.onEnter.action === 'set'
            ? createSprite({ url: args.onEnter.textureURL }, { width, height })
            : undefined

        if (render.sprite) render.container.addChild(render.sprite)
      }
    },

    onResize({ width, height }) {
      args.width = width
      args.height = height
    },

    teardown({ game, physics, onPlayerCollisionStart, onPlayerCollisionEnd }) {
      physics.unregister(this, trigger)
      physics.unlinkTransform(trigger, transform)

      game.events.client?.removeListener(
        'onPlayerCollisionStart',
        onPlayerCollisionStart,
      )

      game.events.client?.removeListener(
        'onPlayerCollisionEnd',
        onPlayerCollisionEnd,
      )
    },

    teardownRenderContext({ container }) {
      container.destroy({ children: true })
    },

    onRenderFrame(_, { debug }, { camera, container, sprite }) {
      const pos = Vec.add(transform.position, camera.offset)

      container.position = pos
      container.angle = transform.rotation
      container.alpha = debug.value ? 0.5 : 0
      if (sprite) sprite.alpha = inside ? 0 : 1
    },
  }
})
