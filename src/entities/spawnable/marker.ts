import { Graphics } from 'pixi.js'
import { z } from 'zod'
import type { Camera } from '~/entities/camera.js'
import { simpleBoundsTest } from '~/math/bounds.js'
import { cloneTransform } from '~/math/transform.js'
import { Vec } from '~/math/vector.js'
import { createSpawnableEntity } from '~/spawnable/spawnableEntity.js'
import type { SpawnableEntity } from '~/spawnable/spawnableEntity.js'
import type { Debug } from '~/utils/debug.js'
import { drawBox } from '~/utils/draw.js'

const ArgsSchema = z.object({
  width: z.number().positive().min(1).default(30),
  height: z.number().positive().min(1).default(30),
})

interface Data {
  debug: Debug
}

interface Render {
  camera: Camera
  gfx: Graphics
}

export const createMarker = createSpawnableEntity<
  typeof ArgsSchema,
  SpawnableEntity<Data, Render>,
  Data,
  Render
>(ArgsSchema, ({ transform, zIndex, tags }, { width, height }) => ({
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
    gfx.destroy()
  },

  onRenderFrame(_, { debug }, { camera, gfx }) {
    const pos = Vec.add(transform.position, camera.offset)

    gfx.position = pos
    gfx.alpha = debug.value ? 0.5 : 0
  },
}))
