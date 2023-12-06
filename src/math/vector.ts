/* eslint-disable id-length */
import Matter from 'matter-js'
import type { Vector } from 'matter-js'
import { z } from 'zod'
import { snap, truncateFloat } from '~/math/general.js'

export const Vec = Matter.Vector
export type { Vector } from 'matter-js'

export const multiply2 = (a: Vector, b: Vector): Vector => {
  return Vec.create(a.x * b.x, a.y * b.y)
}

export const lerp2 = (a: Vector, b: Vector, t: number): Vector => {
  const x = a.x + (b.x - a.x) * t
  const y = a.y + (b.y - a.y) * t

  return Vec.create(x, y)
}

export const distance = (a: Vector, b: Vector): number => {
  const a2 = (a.x - b.x) ** 2
  const b2 = (a.y - b.y) ** 2

  return Math.sqrt(a2 + b2)
}

export const snapVector = (vec: Vector, factor: number): Vector => {
  const x = snap(vec.x, factor)
  const y = snap(vec.y, factor)

  return Vec.create(x, y)
}

export const truncateVector = (vector: Vector, places = 5): Vector => {
  const x = truncateFloat(vector.x, places)
  const y = truncateFloat(vector.y, places)

  return Vec.create(x, y)
}

/**
 * @returns angle (in radians)
 */
export const angleBetween = (a: Vector, b: Vector): number => {
  return Math.atan2(b.y - a.y, b.x - a.x)
}

export const absolute = (vector: Vector): Vector => {
  return Vec.create(Math.abs(vector.x), Math.abs(vector.y))
}

export const VectorSchema = z
  .object({
    x: z.number(),
    y: z.number(),
  })
  .or(z.tuple([z.number(), z.number()]))
  .transform(coords => {
    const [x, y] = Array.isArray(coords) ? coords : [coords.x, coords.y]
    return Vec.create(x, y)
  })

export type LooseVector = Vector | [x: number, y: number]

/**
 * Ensure a vector object or coordinate tuple is a Vector
 *
 * @param vector - Vector or coordinate tuple
 * @returns
 */
export const v = (vector: LooseVector): Vector => {
  return VectorSchema.parse(vector)
}
