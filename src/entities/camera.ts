/* eslint-disable no-restricted-globals */
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

  // get scale(): ScaleFactor
  // get renderScale(): number
  get offset(): Vector
}

export const createCamera = (
  target: CameraTarget,
  targetWidth: number,
  targetHeight: number,
) => {
  const position = Vector.create()

  const camera: Camera = createEntity({
    get target() {
      return target
    },

    get offset() {
      const x = targetWidth / 2 - position.x
      const y = targetHeight / 2 - position.y

      return Vector.create(x, y)
    },

    async init({ game }) {
      return { debug: game.debug }
    },

    async initRenderContext(_, { stage }) {
      await target.ready
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
      text.gfx.removeFromParent()
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
      text.render(1, debug.value) // TODO: Render text at correct scale
    },
  })

  return camera
}
