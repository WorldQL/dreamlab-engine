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
import { drawCircle } from '~/utils/draw.js'

type Args = typeof ArgsSchema
const ArgsSchema = z.object({
  radius: z.number().positive().min(1).default(60),
  spriteSource: SpriteSourceSchema.optional(),
})

interface Data {
  debug: Debug
  physics: Physics
}

interface Render {
  camera: Camera

  container: Container
  gfx: Graphics
  sprite: Sprite | undefined
}

export const createBouncyBall = createSpawnableEntity<
  Args,
  SpawnableEntity<Data, Render, Args>,
  Data,
  Render
>(ArgsSchema, ({ transform, tags, preview }, args) => {
  const mass = 20
  const body = Matter.Bodies.circle(
    transform.position.x,
    transform.position.y,
    args.radius,
    {
      label: 'bouncyBall',
      render: { visible: false },
      angle: toRadians(transform.rotation),
      isStatic: preview,
      isSensor: preview,

      mass,
      inverseMass: 1 / mass,
      restitution: 0.95,
    },
  )

  return {
    rectangleBounds() {
      return { width: args.radius * 2, height: args.radius * 2 }
    },

    isPointInside(position) {
      return Matter.Query.point([body], position).length > 0
    },

    init({ game, physics }) {
      const debug = game.debug
      physics.register(this, body)
      physics.linkTransform(body, transform)

      if (!tags.includes('net/replicated')) {
        tags.push('net/replicated')
      }

      return { debug, physics, body }
    },

    initRenderContext(_, { stage, camera }) {
      const { radius, spriteSource } = args

      const container = new Container()
      container.sortableChildren = true
      container.zIndex = transform.zIndex

      const gfx = new Graphics()
      gfx.zIndex = 100
      drawCircle(gfx, { radius })

      const width = radius * 2
      const height = radius * 2
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

    onArgsUpdate(path, previous, _data, render) {
      if (render && path.startsWith('spriteSource')) {
        const { radius, spriteSource } = args

        const width = radius * 2
        const height = radius * 2

        render.sprite?.destroy()
        render.sprite = spriteSource
          ? createSprite(spriteSource, { width, height })
          : undefined

        if (render.sprite) render.container.addChild(render.sprite)
      }

      if (path === 'radius') {
        const originalRadius = previous.radius
        const radius = args.radius

        const scale = radius / originalRadius
        Matter.Body.setAngle(body, 0)
        Matter.Body.scale(body, scale, scale)
        Matter.Body.setAngle(body, toRadians(transform.rotation))
        Matter.Body.setMass(body, mass)

        if (render) {
          drawCircle(render.gfx, { radius })
          if (render.sprite) {
            render.sprite.width = radius * 2
            render.sprite.height = radius * 2
          }
        }
      }
    },

    onResize({ width, height }) {
      args.radius = Math.max(width / 2, height / 2)
    },

    teardown({ physics }) {
      physics.unregister(this, body)
      physics.unlinkTransform(body, transform)
    },

    teardownRenderContext({ container }) {
      container.destroy({ children: true })
    },

    onRenderFrame({ smooth }, { debug }, { camera, container, gfx }) {
      const smoothed = Vec.add(body.position, Vec.mult(body.velocity, smooth))
      const pos = Vec.add(smoothed, camera.offset)

      container.position = pos
      container.rotation = body.angle
      gfx.alpha = debug.value ? 0.5 : 0
    },
  }
})
