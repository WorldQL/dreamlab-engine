import { Bodies, Composite, Query, Vector } from 'matter-js'
import { Graphics } from 'pixi.js'
import { drawBox } from '~/debug/shapes.js'
import { createSpawnableEntity } from '~/spawnable/spawnableEntity.js'

export const createSolid = createSpawnableEntity(
  'createSolid',
  (
    { position: { x, y }, zIndex, tags, preview },
    width: number,
    height: number,
  ) => {
    const body = Bodies.rectangle(x, y, width, height, {
      label: 'Wall',
      render: { visible: false },

      isStatic: true,
      isSensor: preview,
      friction: 0,
    })

    return {
      get position() {
        return Vector.create(x, y)
      },

      get tags() {
        return tags
      },

      init({ game, physics }) {
        const debug = game.debug
        Composite.add(physics.world, body)

        return { debug, physics, body }
      },

      initRenderContext(_, { stage, camera }) {
        const gfx = new Graphics()
        gfx.zIndex = zIndex

        drawBox(gfx, { width, height })
        stage.addChild(gfx)

        return { gfx, camera }
      },

      onRenderFrame(_, { debug }, { gfx, camera }) {
        gfx.position = camera.offset
        gfx.alpha = debug.value ? 1 : 0
      },

      teardown({ physics, body }) {
        Composite.remove(physics.world, body)
      },

      teardownRenderContext({ gfx }) {
        gfx.removeFromParent()
        gfx.destroy()
      },

      isInBounds(position) {
        return Query.point([body], position).length > 0
      },
    }
  },
)
