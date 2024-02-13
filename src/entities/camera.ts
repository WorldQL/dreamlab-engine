import type { Container } from 'pixi.js'
import type { NonNegative } from 'type-fest'
import type { RenderTime } from '~/entity.js'
import { Entity } from '~/entity.js'
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

export class Camera extends Entity {
  readonly #targetWidth: number
  readonly #targetHeight: number
  readonly #debug: Debug
  readonly #canvas: HTMLCanvasElement
  readonly #stage: Container

  #position = Vec.create()
  #target: CameraTarget | undefined
  #smoothing: NonNegative<number> = 0.125

  #zoomScaleTarget = 0.373_9
  #zoomScale = 0.373_9
  #zoomScaleLevelIdx = 32

  #renderScale = 1
  #renderScaleChanged = false

  readonly #text: DebugText

  #onWheelInner(ev: WheelEvent) {
    if (!ev.ctrlKey) return
    ev.preventDefault()

    const delta = -Math.sign(ev.deltaY)
    this.#zoomScaleLevelIdx = Math.max(
      0,
      Math.min(SCALE_LEVELS.length - 1, this.#zoomScaleLevelIdx + delta),
    )

    this.#zoomScaleTarget = SCALE_LEVELS[this.#zoomScaleLevelIdx] as number
  }

  #onWheel = this.#onWheelInner.bind(this)

  public constructor(
    targetWidth: number,
    targetHeight: number,
    debug: Debug,
    canvas: HTMLCanvasElement,
    stage: Container,
    target?: CameraTarget,
  ) {
    super()

    this.#targetWidth = targetWidth
    this.#targetHeight = targetHeight
    this.#debug = debug
    this.#canvas = canvas
    this.#stage = stage
    this.#target = target ?? undefined

    if (this.#target) {
      const targetPosition =
        'position' in this.#target
          ? this.#target.position
          : this.#target.transform.position

      this.#position.x = targetPosition.x
      this.#position.y = targetPosition.y
    }

    this.#text = createDebugText(0)
    stage.addChild(this.#text.gfx)

    // TODO: Re-add input manager disable logic
    canvas.addEventListener('wheel', this.#onWheel)
  }

  public override teardown(): void {
    this.#text.gfx.destroy()
    // TODO: Same as above
    this.#canvas.removeEventListener('wheel', this.#onWheel)
  }

  // #region Target
  public get target(): CameraTarget | undefined {
    return this.#target
  }

  public set target(value: CameraTarget | undefined) {
    this.#target = value
  }

  public setPosition(postion: LooseVector): void {
    const pos = v(postion)
    this.#target = { position: pos }
  }

  public clearTarget(): void {
    this.#target = undefined
  }
  // #endregion

  // #region Smoothing
  public get smoothing(): NonNegative<number> {
    return this.#smoothing
  }

  public set smoothing(value: NonNegative<number>) {
    if (value < 0) {
      throw new Error('`smoothing` cannot be less than 0')
    }

    this.#smoothing = value
  }
  // #endregion

  public get zoomScale(): number {
    return this.#zoomScale
  }

  public get renderScale(): number {
    return this.#renderScale
  }

  public get scale(): number {
    return this.#zoomScale * this.#renderScale
  }

  public get position(): Readonly<Vector> {
    return Vec.clone(this.#position)
  }

  public get offset(): Readonly<Vector> {
    const targetAspectRatio = this.#targetWidth / this.#targetHeight
    const actualWidth = this.#canvas.width
    const actualHeight = this.#canvas.height

    // Calculate the expected height for the target aspect ratio with the actual width
    const targetCanvasHeight = actualWidth / targetAspectRatio
    // Calculate the difference in height
    const heightDifference = actualHeight - targetCanvasHeight

    // Calculate scaling factor for height offset
    const offsetScaleFactor = (actualWidth / this.#targetWidth) * 2
    // Calculate final height offset
    const heightOffset = heightDifference / offsetScaleFactor

    const x = this.#targetWidth / this.zoomScale / 2 - this.#position.x
    const y =
      this.#targetHeight / this.zoomScale / 2 -
      this.#position.y +
      heightOffset / this.zoomScale

    return Vec.create(x, y)
  }

  public rescale(options: RescaleOptions) {
    const { scale: newScale, renderScale: newRenderScale } = options

    if (newScale) this.#zoomScaleTarget = newScale
    if (newRenderScale) {
      this.#renderScale = newRenderScale
      this.#renderScaleChanged = true
    }
  }

  public screenToWorld(position: Vector): Vector {
    return Vec.sub(Vec.div(position, this.scale), this.offset)
  }

  public override onRenderFrame({ delta }: RenderTime): void {
    let scaleChanged = false
    if (this.#zoomScale !== this.#zoomScaleTarget) {
      this.#zoomScale = lerp(this.#zoomScale, this.#zoomScaleTarget, delta * 12)
      const dist = Math.abs(1 - this.#zoomScale / this.#zoomScaleTarget)
      if (dist < 0.001) this.#zoomScale = this.#zoomScaleTarget

      scaleChanged = true
    }

    if (this.#renderScaleChanged) {
      this.#renderScaleChanged = false
      scaleChanged = true
    }

    if (scaleChanged) {
      const finalScale = this.#zoomScale * this.#renderScale
      this.#stage.scale.set(finalScale)
    }

    const targetPosition =
      this.#target === undefined
        ? Vec.create()
        : 'position' in this.#target
          ? this.#target.position
          : this.#target.transform.position

    if (this.#smoothing > 0) {
      // TODO: Calculate camera speed based on S curve of the distance
      // (fast when close and when far, medium speed when at normal movement distances)
      const dist = Math.min(distance(this.#position, targetPosition), 500)
      const { x, y } = lerp2(
        this.#position,
        targetPosition,
        1 - 0.5 ** (delta * (1 / this.#smoothing)),
      )

      this.#position.x = x
      this.#position.y = y

      if (dist < 1) {
        this.#position.x = targetPosition.x
        this.#position.y = targetPosition.y
      }
    } else {
      this.#position.x = targetPosition.x
      this.#position.y = targetPosition.y
    }

    const xcoord = this.#position.x.toFixed(0)
    const ycoord = this.#position.y.toFixed(0)
    const content = `camera position: { x: ${xcoord}, y: ${ycoord} }`

    this.#text.update(content)
    this.#text.render(this.scale, this.#debug.value)
  }
}

interface RescaleOptions {
  scale?: number
  renderScale?: number
}
