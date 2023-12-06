import Matter from 'matter-js'
import { Graphics } from 'pixi.js'
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
import type { Debug } from '~/utils/debug.js'
import { drawBox } from '~/utils/draw.js'

const BackgroundActionSetSchema = z.object({
  action: z.literal('set'),
  textureURL: z.string(),
  scale: VectorSchema.optional(),
  parallax: VectorSchema.optional(),
})

const BackgroundActionClearSchema = z.object({
  action: z.literal('clear'),
})

export type BackgroundAction = z.infer<typeof BackgroundActionSchema>
const BackgroundActionSchema = z.discriminatedUnion('action', [
  BackgroundActionSetSchema,
  BackgroundActionClearSchema,
])

type Args = typeof ArgsSchema
const ArgsSchema = z.object({
  width: z.number().positive().min(1).default(30),
  height: z.number().positive().min(1).default(30),

  onEnter: BackgroundActionSchema.default({ action: 'clear' }),
  onLeave: BackgroundActionSchema.default({ action: 'clear' }),
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
  gfx: Graphics
}

export const createBackgroundTrigger = createSpawnableEntity<
  Args,
  SpawnableEntity<Data, Render, Args>,
  Data,
  Render
>(ArgsSchema, ({ transform, tags }, args) => {
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
    get tags() {
      return tags
    },

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
        if (action.action === 'set') {
          background.args.textureURL = action.textureURL
          if (action.scale) background.args.scale = action.scale
          if (action.parallax) background.args.parallax = action.parallax
        } else {
          background.args.textureURL = undefined
        }
      }

      const onPlayerCollisionStart: EventHandler<
        'onPlayerCollisionStart'
      > = async ([_player, other]) => {
        if (other !== trigger) return
        await updateBackground(args.onEnter)
      }

      const onPlayerCollisionEnd: EventHandler<
        'onPlayerCollisionEnd'
      > = async ([_player, other]) => {
        if (other !== trigger) return
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

      const gfx = new Graphics()
      gfx.zIndex = transform.zIndex
      drawBox(gfx, { width, height }, { stroke: colour })

      stage.addChild(gfx)
      transform.addZIndexListener(() => {
        gfx.zIndex = transform.zIndex
      })

      return { camera, gfx }
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
        }
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

    teardownRenderContext({ gfx }) {
      gfx.destroy()
    },

    onRenderFrame(_, { debug }, { camera, gfx }) {
      const pos = Vec.add(transform.position, camera.offset)

      gfx.position = pos
      gfx.angle = transform.rotation
      gfx.alpha = debug.value ? 0.5 : 0
    },
  }
})
