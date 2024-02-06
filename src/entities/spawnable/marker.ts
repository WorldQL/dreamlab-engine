import { Graphics } from 'pixi.js'
import { z } from 'zod'
import type { Camera } from '~/entities/camera.js'
import { simpleBoundsTest } from '~/math/bounds.js'
import { Vec } from '~/math/vector.js'
import { createSpawnableEntity } from '~/spawnable/spawnableEntity.js'
import type { SpawnableEntity } from '~/spawnable/spawnableEntity.js'
import type { Debug } from '~/utils/debug.js'
import { drawBox } from '~/utils/draw.js'
import type { RedrawBox } from '~/utils/draw.js'

type Args = typeof ArgsSchema
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
  redrawGfx: RedrawBox
}

export const createMarker = createSpawnableEntity<
  Args,
  SpawnableEntity<Data, Render, Args>,
  Data,
  Render
>(ArgsSchema, ({ transform }, args) => ({
  rectangleBounds() {
    return { width: args.width, height: args.height }
  },

  isPointInside(point) {
    return simpleBoundsTest(
      { width: args.width, height: args.height },
      transform,
      point,
    )
  },

  init({ game }) {
    return { debug: game.debug }
  },

  initRenderContext(_, { stage, camera }) {
    const { width, height } = args

    const gfx = new Graphics()
    gfx.zIndex = transform.zIndex
    const redrawGfx = drawBox(gfx, { width, height }, { stroke: '#00bcff' })

    stage.addChild(gfx)
    transform.addZIndexListener(() => {
      gfx.zIndex = transform.zIndex
    })

    return { camera, gfx, redrawGfx }
  },

  onArgsUpdate(path, _, _data, render) {
    if (render && (path === 'width' || path === 'height')) {
      render.redrawGfx(args)
    }
  },

  onResize({ width, height }) {
    args.width = width
    args.height = height
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
    gfx.angle = transform.rotation
    gfx.alpha = debug.value ? 0.5 : 0
  },
}))
