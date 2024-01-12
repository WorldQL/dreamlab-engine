import Matter from 'matter-js'
import { Container, Graphics } from 'pixi.js'
import type { Sprite } from 'pixi.js'
import { z } from 'zod'
import type { Camera } from '~/entities/camera.js'
import { toRadians } from '~/math/general.js'
import { Vec } from '~/math/vector.js'
import type { Physics } from '~/physics.js'
import { createSpawnableEntity } from '~/spawnable/spawnableEntity.js'
import type { SpawnableEntity } from '~/spawnable/spawnableEntity.js'
import { createSprite, SpriteSourceSchema } from '~/textures/sprites.js'
import type { Debug } from '~/utils/debug.js'
import { drawBox } from '~/utils/draw.js'

type Args = typeof ArgsSchema
const ArgsSchema = z.object({
  width: z.number().positive().min(1).default(100),
  height: z.number().positive().min(1).default(100),
  spriteSource: SpriteSourceSchema.optional(),
})

interface Data {
  debug: Debug
  physics: Physics
  body: Matter.Body
}

interface Render {
  camera: Camera
  container: Container
  gfx: Graphics
  sprite: Sprite | undefined
}

export const createSolid = createSpawnableEntity<
  Args,
  SpawnableEntity<Data, Render, Args>,
  Data,
  Render
>(ArgsSchema, ({ transform, preview }, args) => {
  const body = Matter.Bodies.rectangle(
    transform.position.x,
    transform.position.y,
    args.width,
    args.height,
    {
      label: 'solid',
      render: { visible: false },
      angle: toRadians(transform.rotation),

      isStatic: true,
      isSensor: preview,
      friction: 0,
    },
  )

  return {
    rectangleBounds() {
      return { width: args.width, height: args.height }
    },

    isPointInside(position) {
      return Matter.Query.point([body], position).length > 0
    },

    init({ game, physics }) {
      const debug = game.debug
      physics.register(this, body)
      physics.linkTransform(body, transform)

      return { debug, physics, body }
    },

    initRenderContext(_, { stage, camera }) {
      const { width, height, spriteSource } = args

      const container = new Container()
      container.sortableChildren = true
      container.zIndex = transform.zIndex

      const gfx = new Graphics()
      gfx.zIndex = 100
      drawBox(gfx, { width, height })

      const sprite = spriteSource
        ? createSprite(spriteSource, { width, height })
        : undefined

      container.addChild(gfx)
      if (sprite) container.addChild(sprite)
      stage.addChild(container)

      transform.addZIndexListener(() => {
        container.zIndex = transform.zIndex
      })

      return { camera, container, gfx, sprite }
    },

    onArgsUpdate(path, previous, data, render) {
      if (render && path.startsWith('spriteSource')) {
        const { width, height, spriteSource } = args

        render.sprite?.destroy()
        render.sprite = spriteSource
          ? createSprite(spriteSource, { width, height })
          : undefined

        if (render.sprite) render.container.addChild(render.sprite)
      }

      if (path === 'width' || path === 'height') {
        const { width: originalWidth, height: originalHeight } = previous
        const { width, height } = args

        const scaleX = width / originalWidth
        const scaleY = height / originalHeight

        Matter.Body.setAngle(data.body, 0)
        Matter.Body.scale(data.body, scaleX, scaleY)
        Matter.Body.setAngle(body, toRadians(transform.rotation))

        if (render) {
          drawBox(render.gfx, { width, height })
          if (render.sprite) {
            render.sprite.width = width
            render.sprite.height = height
          }
        }
      }
    },

    onResize({ width, height }) {
      args.width = width
      args.height = height
    },

    teardown({ physics, body }) {
      physics.unregister(this, body)
      physics.unlinkTransform(body, transform)
    },

    teardownRenderContext({ gfx, sprite }) {
      gfx.destroy()
      sprite?.destroy()
    },

    onRenderFrame(_, { debug }, { camera, container, gfx }) {
      const pos = Vec.add(transform.position, camera.offset)

      container.position = pos
      container.rotation = body.angle
      gfx.alpha = debug.value ? 0.5 : 0
    },
  }
})
