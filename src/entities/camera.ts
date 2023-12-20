import type { Container } from 'pixi.js'
import type { NonNegative } from 'type-fest'
import { createEntity } from '~/entity.js'
import type { Entity } from '~/entity.js'
import type { Game } from '~/game.js'
import { lerp } from '~/math/general.js'
import type { Transform } from '~/math/transform.js'
import { distance, lerp2, v, Vec } from '~/math/vector.js'
import type { LooseVector, Vector } from '~/math/vector.js'
import { createDebugText } from '~/utils/debug.js'
import type { Debug, DebugText } from '~/utils/debug.js'

const SCALE_LEVELS = [
  0.125, 0.25, 0.5, 0.75, 1, 1.25, 1.5, 1.75, 2,
] as const satisfies readonly number[]

interface PositionTarget {
  get position(): Vector
}

interface TransformTarget {
  get transform(): Transform
}

export type CameraTarget = PositionTarget | TransformTarget

interface Data {
  get debug(): Debug
}

interface Render {
  game: Game<false>
  stage: Container

  text: DebugText
}

export interface Camera extends Entity<Data, Render> {
  get target(): CameraTarget | undefined
  setTarget(target: CameraTarget): void
  setPosition(position: LooseVector): void
  clearTarget(): void

  get smoothing(): number
  setSmoothing(smoothing: number): void

  get zoomScale(): number
  get renderScale(): number
  get scale(): number
  get offset(): Readonly<Vector>
  get position(): Readonly<Vector>

  rescale(scale: RescaleOptions): void
  screenToWorld(position: Vector): Vector
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
  const position = Vec.create()
  let targetRef = target
  let smoothing = 0.125

  let zoomScaleTarget = 1
  let zoomScale = 1

  let renderScale = 1
  let renderScaleChanged = false

  let zoomScaleLevelIdx = 3
  const onWheel = (ev: WheelEvent) => {
    const isTouchpad = Math.abs(ev.deltaX) !== 0 || Math.abs(ev.deltaY) < 15

    if (!isTouchpad || (isTouchpad && ev.ctrlKey)) {
      const delta = -Math.sign(ev.deltaY)
      zoomScaleLevelIdx = Math.max(
        0,
        Math.min(SCALE_LEVELS.length - 1, zoomScaleLevelIdx + delta),
      )

      zoomScaleTarget = SCALE_LEVELS[zoomScaleLevelIdx] as number
    }
  }

  const camera: Camera = createEntity({
    get target() {
      return targetRef
    },

    get smoothing() {
      return smoothing
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

    setSmoothing(value: NonNegative<number>) {
      if (smoothing < 0) {
        throw new Error('`smoothing` cannot be less than 0')
      }

      smoothing = value
    },

    get zoomScale() {
      return zoomScale
    },

    get renderScale() {
      return renderScale
    },

    get scale() {
      return zoomScale * renderScale
    },

    get position(): Readonly<Vector> {
      return Vec.clone(position)
    },

    get offset(): Readonly<Vector> {
      const x = canvasWidth / this.zoomScale / 2 - position.x
      const y = canvasHeight / this.zoomScale / 2 - position.y

      return Vec.create(x, y)
    },

    rescale({ scale: newScale, renderScale: newRenderScale }: RescaleOptions) {
      if (newScale) zoomScaleTarget = newScale
      if (newRenderScale) {
        renderScale = newRenderScale
        renderScaleChanged = true
      }
    },

    screenToWorld(pos: Vector) {
      return Vec.sub(Vec.div(pos, this.scale), this.offset)
    },

    async init({ game }) {
      return { debug: game.debug }
    },

    async initRenderContext({ game }, { stage }) {
      if (targetRef) {
        const targetPosition =
          'position' in targetRef
            ? targetRef.position
            : targetRef.transform.position

        position.x = targetPosition.x
        position.y = targetPosition.y
      }

      const text = createDebugText(0)
      stage.addChild(text.gfx)

      game.client.inputs.addListener('onWheel', onWheel)

      return { game, stage, text }
    },

    teardown(_) {
      // No-op
    },

    teardownRenderContext({ game, text }) {
      text.gfx.destroy()
      game.client.inputs.addListener('onWheel', onWheel)
    },

    onRenderFrame({ delta }, { debug }, { stage, text }) {
      let scaleChanged = false
      if (zoomScale !== zoomScaleTarget) {
        zoomScale = lerp(zoomScale, zoomScaleTarget, delta * 12)
        const dist = Math.abs(1 - zoomScale / zoomScaleTarget)
        if (dist < 0.001) zoomScale = zoomScaleTarget

        scaleChanged = true
      }

      if (renderScaleChanged) {
        renderScaleChanged = false
        scaleChanged = true
      }

      if (scaleChanged) {
        const finalScale = zoomScale * renderScale
        stage.scale.set(finalScale)
      }

      const targetPosition =
        targetRef === undefined
          ? Vec.create()
          : 'position' in targetRef
          ? targetRef.position
          : targetRef.transform.position

      if (smoothing > 0) {
        // TODO: Calculate camera speed based on S curve of the distance
        // (fast when close and when far, medium speed when at normal movement distances)
        const dist = Math.min(distance(position, targetPosition), 500)
        const { x, y } = lerp2(
          position,
          targetPosition,
          1 - 0.5 ** (delta * (1 / smoothing)),
        )

        position.x = x
        position.y = y

        if (dist < 1) {
          position.x = targetPosition.x
          position.y = targetPosition.y
        }
      } else {
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
