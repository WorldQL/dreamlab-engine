import { z } from 'zod'
import { Vector, VectorSchema } from '~/math/vector.js'
import type { LooseVector } from '~/math/vector.js'

export type Transform = z.infer<typeof TransformSchema>
export const TransformSchema = z.object({
  position: VectorSchema,
  rotation: z.number().default(0),
})

export const cloneTransform = (transform: Transform): Transform => ({
  position: Vector.clone(transform.position),
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
