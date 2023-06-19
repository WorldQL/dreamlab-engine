import { Graphics } from 'pixi.js'
import { cloneTransform } from '~/math/transform.js'
import { Vector } from '~/math/vector.js'
import { createSpawnableEntity } from '~/spawnable/spawnableEntity.js'
import { drawBox } from '~/utils/draw.js'

const width = 30
const height = 30

export const createMarker = createSpawnableEntity(
  'createMarker',
  ({ transform, zIndex, tags }) => ({
    get transform() {
      return cloneTransform(transform)
    },

    get tags() {
      return tags
    },

    isInBounds({ x, y }) {
      const half = Vector.create(width / 2, height / 2)
      const { x: minX, y: minY } = Vector.sub(transform.position, half)
      const { x: maxX, y: maxY } = Vector.add(transform.position, half)

      return x >= minX && x <= maxX && y >= minY && y <= maxY
    },

    init({ game }) {
      const debug = game.debug
      return { debug }
    },

    initRenderContext(_, { stage, camera }) {
      const gfx = new Graphics()
      gfx.zIndex = zIndex

      drawBox(gfx, { width, height }, { stroke: '#00bcff' })

      stage.addChild(gfx)

      return { camera, gfx }
    },

    teardown(_) {
      // No-op
    },

    teardownRenderContext({ gfx }) {
      gfx.removeFromParent()
      gfx.destroy()
    },

    onRenderFrame(_, { debug }, { camera, gfx }) {
      const pos = Vector.add(transform.position, camera.offset)

      gfx.position = pos
      gfx.alpha = debug.value ? 0.5 : 0
    },
  }),
)
