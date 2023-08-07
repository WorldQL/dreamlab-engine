import { Graphics } from 'pixi.js'
import { simpleBoundsTest } from '~/math/bounds.js'
import { cloneTransform } from '~/math/transform.js'
import { Vec } from '~/math/vector.js'
import { createSpawnableEntity } from '~/spawnable/spawnableEntity.js'
import { drawBox } from '~/utils/draw.js'

const width = 30
const height = 30

export const createMarker = createSpawnableEntity(
  ({ transform, zIndex, tags }) => ({
    get transform() {
      return cloneTransform(transform)
    },

    get tags() {
      return tags
    },

    isInBounds(point) {
      return simpleBoundsTest(width, height, transform, point)
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
      const pos = Vec.add(transform.position, camera.offset)

      gfx.position = pos
      gfx.alpha = debug.value ? 0.5 : 0
    },
  }),
)
