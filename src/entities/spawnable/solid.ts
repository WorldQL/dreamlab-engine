import Matter from 'matter-js'
import { Graphics } from 'pixi.js'
import type { Container, Sprite } from 'pixi.js'
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
  stage: Container
  gfx: Graphics
  sprite: Sprite | undefined
}

export const createSolid = createSpawnableEntity<
  Args,
  SpawnableEntity<Data, Render, Args>,
  Data,
  Render
>(ArgsSchema, ({ transform, tags, preview }, args) => {
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
    get tags() {
      return tags
    },

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

      const gfx = new Graphics()
      gfx.zIndex = transform.zIndex + 1
      drawBox(gfx, { width, height })

      const sprite = spriteSource
        ? createSprite(spriteSource, {
            width,
            height,
            zIndex: transform.zIndex,
          })
        : undefined

      stage.addChild(gfx)
      if (sprite) stage.addChild(sprite)

      const render = { camera, stage, gfx, sprite }
      transform.addZIndexListener(() => {
        render.gfx.zIndex = transform.zIndex + 1
        if (render.sprite) render.sprite.zIndex = transform.zIndex
      })

      return render
    },

    onArgsUpdate(path, previous, data, render) {
      if (render && path.startsWith('spriteSource')) {
        const { width, height, spriteSource } = args

        render.sprite?.destroy()
        render.sprite = spriteSource
          ? createSprite(spriteSource, {
              width,
              height,
              zIndex: transform.zIndex,
            })
          : undefined

        if (render.sprite) render.stage.addChild(render.sprite)
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

    onRenderFrame(_, { debug }, { camera, gfx, sprite }) {
      const pos = Vec.add(transform.position, camera.offset)

      gfx.position = pos
      gfx.angle = transform.rotation
      gfx.alpha = debug.value ? 0.5 : 0

      if (sprite) {
        sprite.position = pos
        sprite.angle = transform.rotation
      }
    },
  }
})
