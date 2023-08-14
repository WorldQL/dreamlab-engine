import Matter from 'matter-js'
import { Graphics } from 'pixi.js'
import { toDegrees, toRadians } from '~/math/general.js'
import { Vec } from '~/math/vector.js'
import { createSpawnableEntity } from '~/spawnable/spawnableEntity.js'
import { createSprite } from '~/textures/sprites.js'
import type { SpriteSource } from '~/textures/sprites.js'
import { drawCircle } from '~/utils/draw.js'

export const createBouncyBall = createSpawnableEntity(
  (
    { transform, zIndex, tags, preview },
    radius: number,
    spriteSource?: SpriteSource,
  ) => {
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

      onRenderFrame(_, { debug, body }, { camera, gfx, sprite }) {
        const pos = Vec.add(body.position, camera.offset)

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
