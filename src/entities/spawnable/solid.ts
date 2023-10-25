import Matter from 'matter-js'
import { Graphics } from 'pixi.js'
import type { Sprite } from 'pixi.js'
import { z } from 'zod'
import type { Camera } from '~/entities/camera.js'
import { toRadians } from '~/math/general.js'
import { cloneTransform } from '~/math/transform.js'
import { Vec } from '~/math/vector.js'
import type { Physics } from '~/physics.js'
import { createSpawnableEntity } from '~/spawnable/spawnableEntity.js'
import type { SpawnableEntity } from '~/spawnable/spawnableEntity.js'
import { createSprite, SpriteSourceSchema } from '~/textures/sprites.js'
import type { Debug } from '~/utils/debug.js'
import { drawBox } from '~/utils/draw.js'

const ArgsSchema = z.object({
  width: z.number().positive().min(1),
  height: z.number().positive().min(1),
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

export const createSolid = createSpawnableEntity<
  typeof ArgsSchema,
  SpawnableEntity<Data, Render>,
  Data,
  Render
>(
  ArgsSchema,
  ({ transform, zIndex, tags, preview }, { width, height, spriteSource }) => {
    const { position, rotation } = transform
    const body = Matter.Bodies.rectangle(
      position.x,
      position.y,
      width,
      height,
      {
        label: 'solid',
        render: { visible: false },
        angle: toRadians(rotation),

        isStatic: true,
        isSensor: preview,
        friction: 0,
      },
    )

    return {
      get transform() {
        return cloneTransform(transform)
      },

      get tags() {
        return tags
      },

      bounds() {
        return { width, height }
      },

      init({ game, physics }) {
        const debug = game.debug
        physics.register(this, body)

        return { debug, physics, body }
      },

      initRenderContext(_, { stage, camera }) {
        const gfx = new Graphics()
        gfx.zIndex = zIndex + 1
        drawBox(gfx, { width, height })

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

      onRenderFrame(_, { debug }, { camera, gfx, sprite }) {
        const pos = Vec.add(position, camera.offset)

        gfx.position = pos
        gfx.angle = rotation
        gfx.alpha = debug.value ? 0.5 : 0

        if (sprite) {
          sprite.position = pos
          sprite.angle = rotation
        }
      },
    }
  },
)
