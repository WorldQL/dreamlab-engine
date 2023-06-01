/* eslint-disable id-length */
import { Vector } from 'matter-js'
import { z } from 'zod'

export const lerp2 = (a: Vector, b: Vector, t: number): Vector => {
  const x = a.x + (b.x - a.x) * t
  const y = a.y + (b.y - a.y) * t

  return Vector.create(x, y)
}

export const distance = (a: Vector, b: Vector): number => {
  const a2 = (a.x - b.x) ** 2
  const b2 = (a.y - b.y) ** 2

  return Math.sqrt(a2 + b2)
}

export const snap = (vec: Vector, factor: number): Vector => {
  const x = Math.round(vec.x / factor) * factor
  const y = Math.round(vec.y / factor) * factor

  return Vector.create(x, y)
}

export { Vector } from 'matter-js'
export const VectorSchema = z
  .object({
    x: z.number(),
    y: z.number(),
  })
  .or(z.tuple([z.number(), z.number()]))
  .transform(coords => {
    const [x, y] = Array.isArray(coords) ? coords : [coords.x, coords.y]
    return Vector.create(x, y)
  })
