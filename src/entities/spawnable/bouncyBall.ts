import Matter from 'matter-js'
import { Graphics } from 'pixi.js'
import type { Sprite } from 'pixi.js'
import { z } from 'zod'
import type { Camera } from '~/entities/camera.js'
import { toDegrees, toRadians } from '~/math/general.js'
import { Vec } from '~/math/vector.js'
import type { Physics } from '~/physics.js'
import { createSpawnableEntity } from '~/spawnable/spawnableEntity.js'
import type { SpawnableEntity } from '~/spawnable/spawnableEntity.js'
import { createSprite, SpriteSourceSchema } from '~/textures/sprites.js'
import type { Debug } from '~/utils/debug.js'
import { drawCircle } from '~/utils/draw.js'

const ArgsSchema = z.object({
  radius: z.number().positive().min(1),
  spriteSource: SpriteSourceSchema.optional(),
})

interface Data {
  debug: Debug
  physics: Physics
  body: Matter.Body
}

interface Render {
  camera: Camera
  gfx: Graphics
  sprite: Sprite | undefined
}

export const createBouncyBall = createSpawnableEntity<
  typeof ArgsSchema,
  SpawnableEntity<Data, Render>,
  Data,
  Render
>(
  ArgsSchema,
  ({ transform, zIndex, tags, preview }, { radius, spriteSource }) => {
    const { position, rotation } = transform

    const mass = 20
    const body = Matter.Bodies.circle(position.x, position.y, radius, {
      label: 'bouncyBall',
      render: { visible: false },
      angle: toRadians(rotation),
      isStatic: preview,
      isSensor: preview,

      // inertia: Number.POSITIVE_INFINITY,
      // inverseInertia: 0,
      mass,
      inverseMass: 1 / mass,
      restitution: 0.95,
    })

    return {
      get transform() {
        return {
          position: Vec.clone(body.position),
          rotation: toDegrees(body.angle),
        }
      },

      get tags() {
        return tags
      },

      isInBounds(position) {
        return Matter.Query.point([body], position).length > 0
      },

      init({ game, physics }) {
        const debug = game.debug
        physics.register(this, body)

        return { debug, physics, body }
      },

      initRenderContext(_, { stage, camera }) {
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

        return { camera, gfx, sprite }
      },

      teardown({ physics, body }) {
        physics.unregister(this, body)
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
          sprite.angle = rotation
        }
      },
    }
  },
)
