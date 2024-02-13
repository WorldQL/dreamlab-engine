import type { Camera } from '~/entities/camera'
import type { InitContext, InitRenderContext, RenderTime } from '~/entity'
import { Entity } from '~/entity'
import type { Game } from '~/game'
import type { Vector } from '~/math/vector'
import { createDebugText } from '~/utils/debug'
import type { Debug, DebugText } from '~/utils/debug'

function onPointerOut(this: Cursor) {
  this.cursorPosition = undefined
}

function onPointerMove(this: Cursor, ev: PointerEvent) {
  this.cursorPosition = { x: ev.offsetX, y: ev.offsetY }
}

export class Cursor extends Entity {
  protected cursorPosition: Vector | undefined = undefined
  readonly #onPointerOut = onPointerOut.bind(this)
  readonly #onPointerMove = onPointerMove.bind(this)

  private declare game: Game<boolean>
  private declare debug: Debug
  private declare container: HTMLDivElement
  private declare camera: Camera
  private declare text: DebugText

  public override init({ game }: InitContext): void {
    this.game = game
    this.debug = game.debug
  }

  public override initRender({
    container,
    stage,
    camera,
  }: InitRenderContext): void {
    this.container = container
    this.camera = camera

    this.text = createDebugText(1)
    stage.addChild(this.text.gfx)

    container.addEventListener('pointerover', this.#onPointerMove)
    container.addEventListener('pointerout', this.#onPointerOut)
    container.addEventListener('pointermove', this.#onPointerMove)
  }

  public override teardown(): void {
    // No-op
  }

  public override teardownRender(): void {
    this.text.gfx.destroy()

    this.container.removeEventListener('pointerover', this.#onPointerMove)
    this.container.removeEventListener('pointerout', this.#onPointerOut)
    this.container.removeEventListener('pointermove', this.#onPointerMove)
  }

  public override onRenderFrame(_: RenderTime): void {
    if (this.cursorPosition) {
      const { x, y } = this.camera.screenToWorld(this.cursorPosition)

      const query = this.game.queryPosition({ x, y })
      const entities = query.map(({ definition: { entity } }) => entity)

      const xcoord = x.toFixed(0)
      const ycoord = y.toFixed(0)

      const content =
        `cursor coordinates: { x: ${xcoord}, y: ${ycoord} }\n` +
        `entities: ${JSON.stringify(entities)}`

      this.text.update(content)
    }

    this.text.render(
      this.camera.scale,
      this.debug.value && this.cursorPosition !== undefined,
    )
  }
}
