import { z } from 'zod'
import { Vec, VectorSchema } from '~/math/vector.js'
import type { LooseVector, Vector } from '~/math/vector.js'

export type Transform = z.infer<typeof TransformSchema>
export const TransformSchema = z.object({
  position: VectorSchema,
  rotation: z.number().default(0),
})

export const cloneTransform = (transform: Transform): Transform => ({
  position: Vec.clone(transform.position),
  rotation: transform.rotation,
})

export interface LooseTransform {
  position: LooseVector
  rotation?: number
}

// eslint-disable-next-line id-length
export const t = (transform: LooseTransform): Transform => {
  return TransformSchema.parse(transform)
}

type PositionListener = (component: 'x' | 'y', value: number) => void
type RotationListener = (rotation: number) => void

export const trackedSymbol = Symbol.for('@dreamlab/core/trackedTransform')
interface TrackedTransformAugment {
  [trackedSymbol]: { transform: Transform; position: Vector }

  addPositionListener(fn: PositionListener): void
  addRotationListener(fn: RotationListener): void
  removeListener(fn: (...args: unknown[]) => void): void
}

// eslint-disable-next-line @typescript-eslint/sort-type-constituents
export type TrackedTransform = Transform & TrackedTransformAugment
export const trackTransform = (transform: Transform): TrackedTransform => {
  const positionListeners = new Set<PositionListener>()
  const rotationListeners = new Set<RotationListener>()

  const innerPosition: Vector = {
    x: transform.position.x,
    y: transform.position.y,
  }

  const positionProxy = new Proxy<Vector>(innerPosition, {
    set: (target, property, value, _receiver) => {
      if (property !== 'x' && property !== 'y') return false

      target[property] = value
      for (const fn of positionListeners) fn(property, value)

      return true
    },
  })

  const innerTransform: Transform = {
    position: positionProxy,
    rotation: transform.rotation,
  }

  const transformProxy = new Proxy<Transform>(innerTransform, {
    set: (target, property, value, receiver) => {
      if (
        property === trackedSymbol ||
        property === 'addPositionListener' ||
        property === 'addRotationListener' ||
        property === 'removeListener'
      ) {
        return Reflect.set(target, property, value, receiver)
      }

      if (property !== 'position' && property !== 'rotation') return false
      if (property === 'rotation') {
        target.rotation = value
        for (const fn of rotationListeners) fn(value)
        return true
      }

      target.position.x = value.x
      target.position.y = value.y

      return true
    },
  })

  const augment: TrackedTransformAugment = {
    [trackedSymbol]: { transform: innerTransform, position: innerPosition },

    addPositionListener: fn => void positionListeners.add(fn),
    addRotationListener: fn => void rotationListeners.add(fn),

    removeListener: fn => {
      positionListeners.delete(fn)
      rotationListeners.delete(fn)
    },
  }

  return Object.assign(transformProxy, augment)
}
