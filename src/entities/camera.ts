/* eslint-disable no-restricted-globals */
import type { Container } from 'pixi.js'
import { createDebugText } from '~/debug/text.js'
import type { DebugText } from '~/debug/text.js'
import type { Debug } from '~/debug/value.js'
import { createEntity } from '~/entity.js'
import type { Entity } from '~/entity.js'
import { distance, lerp2, Vector } from '~/math/vector.js'

export type SetCameraTarget = (position: Vector) => void
export interface CameraTarget {
  get ready(): Promise<void>
  get position(): Vector
}

export const createCameraTarget = (
  initialPosition?: Vector,
): [CameraTarget, SetCameraTarget] => {
  let position = initialPosition ? Vector.clone(initialPosition) : undefined

  const target: CameraTarget = {
    get ready() {
      if (position !== undefined) return Promise.resolve()

      return new Promise<void>(resolve => {
        const interval = setInterval(() => {
          if (position === undefined) return

          clearInterval(interval)
          resolve()
        }, 50)
      })
    },

    get position() {
      if (position === undefined) {
        throw new Error('position accessed before target was ready')
      }

      return position
    },
  }

  const setter: SetCameraTarget = value => {
    position = value
  }

  return [target, setter]
}

interface Data {
  get debug(): Debug
}

interface Render {
  text: DebugText
}

export interface Camera extends Entity<Data, Render> {
  get target(): CameraTarget

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
  target: CameraTarget,
  targetWidth: number,
  targetHeight: number,
) => {
  const position = Vector.create()
  let stageRef: Container | undefined

  let scale = 1
  let renderScale = 1

  const camera: Camera = createEntity({
    get target() {
      return target
    },

    // TODO: Allow scale to be changed
    get scale() {
      return scale
    },

    get renderScale() {
      return renderScale
    },

    get offset(): Vector {
      const x = targetWidth / this.scale / 2 - position.x
      const y = targetHeight / this.scale / 2 - position.y

      return Vector.create(x, y)
    },

    rescale({ scale: newScale, renderScale: newRenderScale }: RescaleOptions) {
      if (!stageRef) return

      if (newScale) scale = newScale
      if (newRenderScale) renderScale = newRenderScale

      const finalScale = scale * renderScale
      stageRef.scale.set(finalScale)
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

    async initRenderContext(_, { stage }) {
      await target.ready
      stageRef = stage

      position.x = target.position.x
      position.y = target.position.y

      const text = createDebugText(0)
      stage.addChild(text.gfx)

      return { text }
    },

    teardown(_) {
      // No-op
    },

    teardownRenderContext({ text }) {
      stageRef = undefined

      text.gfx.removeFromParent()
      text.gfx.destroy()
    },

    onRenderFrame({ delta }, { debug }, { text }) {
      // TODO: Calculate camera speed based on S curve of the distance
      // (fast when close and when far, medium speed when at normal movement distances)
      const dist = Math.min(distance(position, target.position), 500)
      const { x, y } = lerp2(position, target.position, delta * 8)

      position.x = x
      position.y = y

      if (dist < 1) {
        position.x = target.position.x
        position.y = target.position.y
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
