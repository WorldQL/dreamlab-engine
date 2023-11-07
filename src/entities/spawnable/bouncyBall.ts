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
import { drawCircle } from '~/utils/draw.js'

type Args = typeof ArgsSchema
const ArgsSchema = z.object({
  radius: z.number().positive().min(1),
  spriteSource: SpriteSourceSchema.optional(),
  zIndex: z.number().default(0),
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

      // inertia: Number.POSITIVE_INFINITY,
      // inverseInertia: 0,
      mass,
      inverseMass: 1 / mass,
      restitution: 0.95,
    },
  )

  return {
    get tags() {
      return tags
    },

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

      return { debug, physics, body }
    },

    initRenderContext(_, { stage, camera }) {
      const { radius, spriteSource, zIndex } = args

      const gfx = new Graphics()
      gfx.zIndex = zIndex + 1
      drawCircle(gfx, { radius })

      const width = radius * 2
      const height = radius * 2
      const sprite = spriteSource
        ? createSprite(spriteSource, { width, height, zIndex })
        : undefined

      stage.addChild(gfx)
      if (sprite) stage.addChild(sprite)

      return { camera, stage, gfx, sprite }
    },

    onArgsUpdate(path, _data, render) {
      const { radius, spriteSource, zIndex } = args

      if (render && path === 'spriteSource') {
        const width = radius * 2
        const height = radius * 2

        render.sprite?.destroy()
        render.sprite = spriteSource
          ? createSprite(spriteSource, { width, height, zIndex })
          : undefined

        if (render.sprite) render.stage.addChild(render.sprite)
      }

      if (render && path === 'zIndex') {
        render.gfx.zIndex = zIndex + 1
        if (render.sprite) render.sprite.zIndex = zIndex
      }
    },

    onResize({ width, height }, data, render) {
      const originalRadius = args.radius
      const radius = Math.max(width / 2, height / 2)
      args.radius = radius

      const scale = radius / originalRadius
      Matter.Body.setAngle(data.body, 0)
      Matter.Body.scale(data.body, scale, scale)
      Matter.Body.setAngle(body, toRadians(transform.rotation))
      Matter.Body.setMass(data.body, mass)

      if (!render) return
      drawCircle(render.gfx, { radius })
      if (render.sprite) {
        render.sprite.width = radius * 2
        render.sprite.height = radius * 2
      }
    },

    teardown({ physics, body }) {
      physics.unregister(this, body)
      physics.unlinkTransform(body, transform)
    },

    teardownRenderContext({ gfx, sprite }) {
      gfx.destroy()
      sprite?.destroy()
    },

    onRenderFrame({ smooth }, { debug, body }, { camera, gfx, sprite }) {
      const smoothed = Vec.add(body.position, Vec.mult(body.velocity, smooth))
      const pos = Vec.add(smoothed, camera.offset)

      gfx.position = pos
      gfx.rotation = body.angle
      gfx.alpha = debug.value ? 0.5 : 0

      if (sprite) {
        sprite.position = pos
        sprite.rotation = body.angle
      }
    },
  }
})
