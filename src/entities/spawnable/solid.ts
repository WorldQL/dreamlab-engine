import { Bodies, Composite, Query } from 'matter-js'
import { Graphics } from 'pixi.js'
import { Vector } from '~/math/vector.js'
import { createSpawnableEntity } from '~/spawnable/spawnableEntity.js'
import { drawBox } from '~/utils/draw.js'
import { createSprite } from '~/utils/textures.js'
import type { SpriteSource } from '~/utils/textures.js'

export const createSolid = createSpawnableEntity(
  'createSolid',
  (
    { position, zIndex, tags, preview },
    width: number,
    height: number,
    spriteSource?: SpriteSource,
  ) => {
    const body = Bodies.rectangle(position.x, position.y, width, height, {
      label: 'solid',
      render: { visible: false },

      isStatic: true,
      isSensor: preview,
      friction: 0,
    })

    return {
      get position() {
        return Vector.clone(position)
      },

      get tags() {
        return tags
      },

      isInBounds(position) {
        return Query.point([body], position).length > 0
      },

      init({ game, physics }) {
        const debug = game.debug
        Composite.add(physics.world, body)

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
        Composite.remove(physics.world, body)
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
    }
  },
)
