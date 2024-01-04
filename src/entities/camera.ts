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
  0.0625, 0.0661, 0.0699, 0.0739, 0.0782, 0.0827, 0.0874, 0.0924, 0.0977,
  0.1034, 0.1093, 0.1156, 0.1222, 0.1293, 0.1367, 0.1446, 0.1529, 0.1617,
  0.1709, 0.1808, 0.1912, 0.2022, 0.2138, 0.2261, 0.2391, 0.2528, 0.2673,
  0.2827, 0.299, 0.3162, 0.3343, 0.3536, 0.3739, 0.3954, 0.4181, 0.4421, 0.4676,
  0.4944, 0.5229, 0.5529, 0.5847, 0.6183, 0.6539, 0.6915, 0.7312, 0.7733,
  0.8177, 0.8647, 0.9144, 0.967, 1.0226, 1.0814, 1.1436, 1.2093, 1.2788, 1.3524,
  1.4301, 1.5123, 1.5993, 1.6912, 1.7884, 1.8913, 2.0,
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
    if (ev.ctrlKey) {
      ev.preventDefault()
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
