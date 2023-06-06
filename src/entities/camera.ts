import type { Container } from 'pixi.js'
import { createEntity } from '~/entity.js'
import type { Entity } from '~/entity.js'
import { lerp } from '~/math/general.js'
import { distance, lerp2, v, Vector } from '~/math/vector.js'
import type { LooseVector } from '~/math/vector.js'
import type { Debug, DebugText } from '~/utils/debug.js'
import { createDebugText } from '~/utils/debug.js'

const SCALE_LEVELS = [
  0.25, 0.5, 0.75, 1, 1.25, 1.5, 1.75, 2,
] as const satisfies readonly number[]

export interface CameraTarget {
  get position(): Vector
}

interface Data {
  get debug(): Debug
}

interface Render {
  container: HTMLDivElement
  stage: Container

  text: DebugText
}

export interface Camera extends Entity<Data, Render> {
  get target(): CameraTarget | undefined
  setTarget(target: CameraTarget): void
  setPosition(position: LooseVector): void
  clearTarget(): void

  get scale(): number
  get renderScale(): number
  get offset(): Vector

  rescale(scale: RescaleOptions): void
  localToWorld(position: Vector): Vector
}

interface RescaleOptions {
  scale?: number
  renderScale?: number
}

export const createCamera = (
  canvasWidth: number,
  canvasHeight: number,
  target?: CameraTarget,
) => {
  const position = Vector.create()
  let targetRef = target

  let scaleTarget = 1
  let scale = 1

  let renderScale = 1
  let renderScaleChanged = false

  let scaleLevelIdx = 3
  const onWheel = (ev: WheelEvent) => {
    ev.preventDefault()

    const delta = -Math.sign(ev.deltaY)
    scaleLevelIdx = Math.max(
      0,
      Math.min(SCALE_LEVELS.length - 1, scaleLevelIdx + delta),
    )

    scaleTarget = SCALE_LEVELS[scaleLevelIdx] as number
  }

  const camera: Camera = createEntity({
    get target() {
      return targetRef
    },

    setTarget(target: CameraTarget) {
      targetRef = target
    },

    setPosition(position: LooseVector) {
      const pos = v(position)
      this.setTarget({ position: pos })
    },

    clearTarget() {
      targetRef = undefined
    },

    get scale() {
      return scale
    },

    get renderScale() {
      return renderScale
    },

    get offset(): Vector {
      const x = canvasWidth / this.scale / 2 - position.x
      const y = canvasHeight / this.scale / 2 - position.y

      return Vector.create(x, y)
    },

    rescale({ scale: newScale, renderScale: newRenderScale }: RescaleOptions) {
      if (newScale) scaleTarget = newScale
      if (newRenderScale) {
        renderScale = newRenderScale
        renderScaleChanged = true
      }
    },

    localToWorld(pos: Vector) {
      return Vector.sub(
        Vector.div(pos, this.renderScale * this.scale),
        this.offset,
      )
    },

    async init({ game }) {
      return { debug: game.debug }
    },

    async initRenderContext(_, { container, stage }) {
      if (targetRef) {
        position.x = targetRef.position.x
        position.y = targetRef.position.y
      }

      const text = createDebugText(0)
      stage.addChild(text.gfx)

      container.addEventListener('wheel', onWheel)

      return { container, stage, text }
    },

    teardown(_) {
      // No-op
    },

    teardownRenderContext({ container, text }) {
      text.gfx.removeFromParent()
      text.gfx.destroy()

      container.removeEventListener('wheel', onWheel)
    },

    onRenderFrame({ delta }, { debug }, { stage, text }) {
      let scaleChanged = false
      if (scale !== scaleTarget) {
        scale = lerp(scale, scaleTarget, delta * 12)
        const dist = Math.abs(1 - scale / scaleTarget)
        if (dist < 0.001) scale = scaleTarget

        scaleChanged = true
      }

      if (renderScaleChanged) {
        renderScaleChanged = false
        scaleChanged = true
      }

      if (scaleChanged) {
        const finalScale = scale * renderScale
        stage.scale.set(finalScale)
      }

      const targetPosition = targetRef?.position ?? Vector.create()

      // TODO: Calculate camera speed based on S curve of the distance
      // (fast when close and when far, medium speed when at normal movement distances)
      const dist = Math.min(distance(position, targetPosition), 500)
      const { x, y } = lerp2(position, targetPosition, delta * 8)

      position.x = x
      position.y = y

      if (dist < 1) {
        position.x = targetPosition.x
        position.y = targetPosition.y
      }

      const xcoord = position.x.toFixed(0)
      const ycoord = position.y.toFixed(0)
      const content = `camera position: { x: ${xcoord}, y: ${ycoord} }`

      text.update(content)
      text.render(this.scale, debug.value)
    },
  })

  return camera
}
