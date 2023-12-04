import { createEntity } from '~/entity.js'
import { Vec } from '~/math/vector.js'
import type { Vector } from '~/math/vector.js'
import { createDebugText } from '~/utils/debug.js'

export const createCursor = () => {
  let cursorPosition: Vector | undefined

  const onPointerOut = () => (cursorPosition = undefined)
  const onPointerMove = (ev: PointerEvent) => {
    cursorPosition = Vec.create(ev.offsetX, ev.offsetY)
  }

  return createEntity({
    init({ game }) {
      return { game, debug: game.debug }
    },

    initRenderContext(_, { container, stage, camera }) {
      const text = createDebugText(1)
      stage.addChild(text.gfx)

      container.addEventListener('pointerover', onPointerMove)
      container.addEventListener('pointerout', onPointerOut)
      container.addEventListener('pointermove', onPointerMove)

      return { container, camera, text }
    },

    teardown(_) {
      // No-op
    },

    teardownRenderContext({ container, text }) {
      text.gfx.destroy()

      container.removeEventListener('pointerover', onPointerMove)
      container.removeEventListener('pointerout', onPointerOut)
      container.removeEventListener('pointermove', onPointerMove)
    },

    onRenderFrame(_, { game, debug }, { camera, text }) {
      if (cursorPosition) {
        const { x, y } = camera.localToWorld(cursorPosition)

        const query = game.queryPosition({ x, y })
        const entities = query.map(({ definition: { entity } }) => entity)

        const xcoord = x.toFixed(0)
        const ycoord = y.toFixed(0)

        const content =
          `cursor coordinates: { x: ${xcoord}, y: ${ycoord} }\n` +
          `entities: ${JSON.stringify(entities)}`

        text.update(content)
      }

      text.render(camera.scale, debug.value && cursorPosition !== undefined)
    },
  })
}
