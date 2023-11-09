import { Graphics } from 'pixi.js'
import type { Container, Sprite } from 'pixi.js'
import { z } from 'zod'
import type { Camera } from '~/entities/camera.js'
import { simpleBoundsTest } from '~/math/bounds.js'
import { Vec } from '~/math/vector.js'
import { createSpawnableEntity } from '~/spawnable/spawnableEntity.js'
import type { SpawnableEntity } from '~/spawnable/spawnableEntity.js'
import { createSprite, SpriteSourceSchema } from '~/textures/sprites.js'
import type { Debug } from '~/utils/debug.js'
import { drawBox } from '~/utils/draw.js'

type Args = typeof ArgsSchema
const ArgsSchema = z.object({
  width: z.number().positive().min(1).default(100),
  height: z.number().positive().min(1).default(100),
  spriteSource: SpriteSourceSchema.optional(),
})

interface Data {
  debug: Debug
}

interface Render {
  camera: Camera
  stage: Container
  gfx: Graphics
  sprite: Sprite | undefined
}

export const createNonsolid = createSpawnableEntity<
  Args,
  SpawnableEntity<Data, Render, Args>,
  Data,
  Render
>(ArgsSchema, ({ transform, tags }, args) => ({
  get tags() {
    return tags
  },

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
    const { width, height, spriteSource } = args

    const gfx = new Graphics()
    gfx.zIndex = transform.zIndex + 1
    drawBox(gfx, { width, height }, { stroke: 'blue' })

    const sprite = spriteSource
      ? createSprite(spriteSource, { width, height, zIndex: transform.zIndex })
      : undefined

    stage.addChild(gfx)
    if (sprite) stage.addChild(sprite)

    transform.addZIndexListener(() => {
      gfx.zIndex = transform.zIndex + 1
      if (sprite) sprite.zIndex = transform.zIndex
    })

    return { camera, stage, gfx, sprite }
  },

  onArgsUpdate(path, _data, render) {
    if (render && path === 'spriteSource') {
      const { width, height, spriteSource } = args

      render.sprite?.destroy()
      render.sprite = spriteSource
        ? createSprite(spriteSource, {
            width,
            height,
            zIndex: transform.zIndex,
          })
        : undefined

      if (render.sprite) render.stage.addChild(render.sprite)
    }
  },

  onResize({ width, height }, _, render) {
    args.width = width
    args.height = height

    if (!render) return
    drawBox(render.gfx, { width, height }, { stroke: 'blue' })
    if (render.sprite) {
      render.sprite.width = width
      render.sprite.height = height
    }
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
}))
