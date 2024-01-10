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
  0.062_5, 0.066_1, 0.069_9, 0.073_9, 0.078_2, 0.082_7, 0.087_4, 0.092_4,
  0.097_7, 0.103_4, 0.109_3, 0.115_6, 0.122_2, 0.129_3, 0.136_7, 0.144_6,
  0.152_9, 0.161_7, 0.170_9, 0.180_8, 0.191_2, 0.202_2, 0.213_8, 0.226_1,
  0.239_1, 0.252_8, 0.267_3, 0.282_7, 0.299, 0.316_2, 0.334_3, 0.353_6, 0.373_9,
  0.395_4, 0.418_1, 0.442_1, 0.467_6, 0.494_4, 0.522_9, 0.552_9, 0.584_7,
  0.618_3, 0.653_9, 0.691_5, 0.731_2, 0.773_3, 0.817_7, 0.864_7, 0.914_4, 0.967,
  1, 1.022_6, 1.081_4, 1.143_6, 1.209_3, 1.278_8, 1.352_4, 1.430_1, 1.512_3,
  1.599_3, 1.691_2, 1.788_4, 1.891_3, 2,
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
  targetWidth: number,
  targetHeight: number,
  canvas: HTMLCanvasElement,
  target?: CameraTarget,
) => {
  const position = Vec.create()
  let targetRef = target
  let smoothing = 0.125

  let zoomScaleTarget = 1
  let zoomScale = 1

  let renderScale = 1
  let renderScaleChanged = false

  let zoomScaleLevelIdx = 50
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
      const targetAspectRatio = targetWidth / targetHeight
      const actualWidth = canvas.width
      const actualHeight = canvas.height

      // Calculate the expected height for the target aspect ratio with the actual width
      const targetCanvasHeight = actualWidth / targetAspectRatio
      // Calculate the difference in height
      const heightDifference = actualHeight - targetCanvasHeight

      // Calculate scaling factor for height offset
      const offsetScaleFactor = (actualWidth / targetWidth) * 2
      // Calculate final height offset
      const heightOffset = heightDifference / offsetScaleFactor

      const x = targetWidth / this.zoomScale / 2 - position.x
      const y = targetHeight / this.zoomScale / 2 - position.y + heightOffset

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
