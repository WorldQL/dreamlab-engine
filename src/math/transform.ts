import { z } from 'zod'
import { Vec, VectorSchema } from '~/math/vector.js'
import type { LooseVector, Vector } from '~/math/vector.js'

export type Transform = z.infer<typeof TransformSchema>
export const TransformSchema = z.object({
  position: VectorSchema,
  rotation: z.number().default(0),
  zIndex: z.number().default(0),
})

export const cloneTransform = (transform: Transform): Transform => ({
  position: Vec.clone(transform.position),
  rotation: transform.rotation,
  zIndex: transform.zIndex,
})

export interface LooseTransform {
  position: LooseVector
  rotation?: number
  zIndex?: number
}

// eslint-disable-next-line id-length
export const t = (transform: LooseTransform): Transform => {
  return TransformSchema.parse(transform)
}

export type TransformListener = (sync: boolean) => void
export type PositionListener = (
  component: 'x' | 'y',
  value: number,
  delta: number,
) => void
export type RotationListener = (rotation: number, delta: number) => void
export type ZIndexListener = (zIndex: number) => void

/**
 * **Interal Dreamlab use only.**
 * **Not to be used in userscripts.**
 */
export const trackedSymbol = Symbol.for('@dreamlab/core/trackedTransform')
interface TrackedTransformAugment {
  [trackedSymbol]: { transform: Transform; position: Vector; sync(): void }

  addListener(fn: TransformListener): void
  addPositionListener(fn: PositionListener): void
  addRotationListener(fn: RotationListener): void
  addZIndexListener(fn: ZIndexListener): void

  removeListener(
    fn:
      | PositionListener
      | RotationListener
      | TransformListener
      | ZIndexListener,
  ): void
  removeAllListeners(): void
}

// eslint-disable-next-line @typescript-eslint/sort-type-constituents
export type TrackedTransform = Transform & TrackedTransformAugment
export const trackTransform = (transform: Transform): TrackedTransform => {
  const transformListeners = new Set<TransformListener>()
  const positionListeners = new Set<PositionListener>()
  const rotationListeners = new Set<RotationListener>()
  const zIndexListeners = new Set<ZIndexListener>()

  const innerPosition: Vector = {
    x: transform.position.x,
    y: transform.position.y,
  }

  const positionProxy = new Proxy<Vector>(innerPosition, {
    set: (target, property, value, _receiver) => {
      if (property !== 'x' && property !== 'y') return false

      const previous = target[property]
      const delta = value - previous

      target[property] = value
      for (const fn of positionListeners) fn(property, value, delta)
      for (const fn of transformListeners) fn(false)

      return true
    },
  })

  const innerTransform: Transform = {
    position: positionProxy,
    rotation: transform.rotation,
    zIndex: transform.zIndex,
  }

  const transformProxy = new Proxy<Transform>(innerTransform, {
    set: (target, property, value, receiver) => {
      if (
        property === trackedSymbol ||
        property === 'addListener' ||
        property === 'addPositionListener' ||
        property === 'addRotationListener' ||
        property === 'addZIndexListener' ||
        property === 'removeListener' ||
        property === 'removeAllListeners'
      ) {
        return Reflect.set(target, property, value, receiver)
      }

      if (
        property !== 'position' &&
        property !== 'rotation' &&
        property !== 'zIndex'
      ) {
        return false
      }

      if (property === 'rotation') {
        const previous = target.rotation
        const delta = value - previous

        target.rotation = value
        for (const fn of rotationListeners) fn(value, delta)
        for (const fn of transformListeners) fn(false)

        return true
      }

      if (property === 'zIndex') {
        target.zIndex = value
        for (const fn of zIndexListeners) fn(value)
        for (const fn of transformListeners) fn(false)

        return true
      }

      target.position.x = value.x
      target.position.y = value.y

      return true
    },
  })

  const augment: TrackedTransformAugment = {
    [trackedSymbol]: {
      transform: innerTransform,
      position: innerPosition,
      sync: () => {
        for (const fn of transformListeners) fn(true)
      },
    },

    addListener: fn => void transformListeners.add(fn),
    addPositionListener: fn => void positionListeners.add(fn),
    addRotationListener: fn => void rotationListeners.add(fn),
    addZIndexListener: fn => void zIndexListeners.add(fn),

    removeListener: fn => {
      // @ts-expect-error Ignore Types
      transformListeners.delete(fn)

      // @ts-expect-error Ignore Types
      positionListeners.delete(fn)

      // @ts-expect-error Ignore Types
      rotationListeners.delete(fn)

      // @ts-expect-error Ignore Types
      zIndexListeners.delete(fn)
    },

    removeAllListeners: () => {
      transformListeners.clear()
      positionListeners.clear()
      rotationListeners.clear()
      zIndexListeners.clear()
    },
  }

  return Object.assign(transformProxy, augment)
}

/**
 * **Interal Dreamlab use only.**
 * **Not to be used in userscripts.**
 */
export const isTrackedTransform = (
  transform: TrackedTransform | Transform,
): transform is TrackedTransform => {
  return trackedSymbol in transform
}
