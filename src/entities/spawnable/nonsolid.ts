import { Graphics } from 'pixi.js'
import { drawBox } from '~/debug/shapes.js'
import { Vector } from '~/math/vector.js'
import { createSpawnableEntity } from '~/spawnable/spawnableEntity.js'
import { createSprite } from '~/utils/textures.js'

export const createNonsolid = createSpawnableEntity(
  'createNonsolid',
  (
    { position, zIndex, tags },
    width: number,
    height: number,
    textureURL?: string,
  ) => ({
    get position() {
      return Vector.clone(position)
    },

    get tags() {
      return tags
    },

    isInBounds({ x, y }) {
      const half = Vector.create(width / 2, height / 2)
      const { x: minX, y: minY } = Vector.sub(this.position, half)
      const { x: maxX, y: maxY } = Vector.add(this.position, half)

      return x >= minX && x <= maxX && y >= minY && y <= maxY
    },

    init({ game }) {
      return { debug: game.debug }
    },

    initRenderContext(_, { stage, camera }) {
      const gfx = new Graphics()
      gfx.zIndex = zIndex + 1
      drawBox(gfx, { width, height }, { strokeWidth: 10, stroke: 'blue' })

      const sprite = textureURL
        ? createSprite(textureURL, { width, height, zIndex })
        : undefined

      stage.addChild(gfx)
      if (sprite) stage.addChild(sprite)

      return { camera, gfx, sprite }
    },

    teardown(_) {
      // No-op
    },

    teardownRenderContext({ gfx, sprite }) {
      gfx.removeFromParent()
      gfx.destroy()

      if (sprite) {
        sprite.removeFromParent()
        sprite.destroy()
      }
    },

    onRenderFrame(_, { debug }, { camera, gfx, sprite }) {
      const pos = Vector.add(position, camera.offset)

      gfx.position = pos
      gfx.alpha = debug.value ? 0.5 : 0

      if (sprite) sprite.position = pos
    },
  }),
)
