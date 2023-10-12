import { Graphics } from 'pixi.js'
import { simpleBoundsTest } from '~/math/bounds.js'
import { cloneTransform } from '~/math/transform.js'
import { Vec } from '~/math/vector.js'
import { createSpawnableEntity } from '~/spawnable/spawnableEntity.js'
import { createSprite } from '~/textures/sprites.js'
import type { SpriteSource } from '~/textures/sprites.js'
import { drawBox } from '~/utils/draw.js'

export const createNonsolid = createSpawnableEntity(
  (
    { transform, zIndex, tags },
    width: number,
    height: number,
    spriteSource?: SpriteSource,
  ) => ({
    get transform() {
      return cloneTransform(transform)
    },

    get tags() {
      return tags
    },

    get body() {
      return undefined
    },

    isInBounds(point) {
      return simpleBoundsTest(width, height, transform, point)
    },

    init({ game }) {
      return { debug: game.debug }
    },

    initRenderContext(_, { stage, camera }) {
      const gfx = new Graphics()
      gfx.zIndex = zIndex + 1
      drawBox(gfx, { width, height }, { stroke: 'blue' })

      const sprite = spriteSource
        ? createSprite(spriteSource, { width, height, zIndex })
        : undefined

      stage.addChild(gfx)
      if (sprite) stage.addChild(sprite)

      return { camera, gfx, sprite }
    },

    teardown(_) {
      // No-op
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
  }),
)
