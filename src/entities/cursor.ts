import type { RenderTime } from '~/entity'
import { Entity } from '~/entity'
import { camera, debug, game } from '~/labs/magic'
import type { Vector } from '~/math/vector'
import { createDebugText } from '~/utils/debug'
import type { DebugText } from '~/utils/debug'

export class Cursor extends Entity {
  protected cursorPosition: Vector | undefined = undefined
  readonly #onPointerOut = () => {
    this.cursorPosition = undefined
  }

  readonly #onPointerMove = (ev: PointerEvent) => {
    this.cursorPosition = { x: ev.offsetX, y: ev.offsetY }
  }

  readonly #text: DebugText | undefined

  public constructor() {
    super()

    const $game = game('client')
    if ($game) {
      const { container, stage } = $game.client.render

      this.#text = createDebugText(1)
      stage.addChild(this.#text.gfx)

      container.addEventListener('pointerover', this.#onPointerMove)
      container.addEventListener('pointerout', this.#onPointerOut)
      container.addEventListener('pointermove', this.#onPointerMove)
    }
  }

  public override teardown(): void {
    this.#text?.gfx.destroy()

    const $game = game('client')
    if ($game) {
      const { container } = $game.client.render
      container.removeEventListener('pointerover', this.#onPointerMove)
      container.removeEventListener('pointerout', this.#onPointerOut)
      container.removeEventListener('pointermove', this.#onPointerMove)
    }
  }

  public override onRenderFrame(_: RenderTime): void {
    if (this.cursorPosition) {
      const { x, y } = camera().screenToWorld(this.cursorPosition)

      const query = game().queryPosition({ x, y })
      const entities = query.map(({ definition: { entity } }) => entity)

      const xcoord = x.toFixed(0)
      const ycoord = y.toFixed(0)

      const content =
        `cursor coordinates: { x: ${xcoord}, y: ${ycoord} }\n` +
        `entities: ${JSON.stringify(entities)}`

      this.#text?.update(content)
    }

    this.#text?.render(
      camera().scale,
      debug() && this.cursorPosition !== undefined,
    )
  }
}
