import { toRadians } from '~/math/general.js'
import type { Transform } from '~/math/transform.js'
import { Vec } from '~/math/vector.js'
import type { Vector } from '~/math/vector.js'

export interface Bounds {
  width: number
  height: number
}

const fastBoundsTest = (
  width: number,
  height: number,
  position: Vector,
  { x, y }: Vector,
): boolean => {
  const max = Math.max(width, height)
  const size = Vec.create(max * 2, max * 2)

  const { x: minX, y: minY } = Vec.sub(position, size)
  const { x: maxX, y: maxY } = Vec.add(position, size)

  return x >= minX && x <= maxX && y >= minY && y <= maxY
}

export const simpleBoundsTest = (
  bounds: Bounds,
  transform: Transform,
  point: Vector,
): boolean => {
  const { width, height } = bounds

  const fast = fastBoundsTest(width, height, transform.position, point)
  if (!fast) return false

  const radians = toRadians(0 - transform.rotation)
  const { x, y } = Vec.rotateAbout(point, radians, transform.position)

  const half = Vec.create(width / 2, height / 2)
  const { x: minX, y: minY } = Vec.sub(transform.position, half)
  const { x: maxX, y: maxY } = Vec.add(transform.position, half)

  return x >= minX && x <= maxX && y >= minY && y <= maxY
}
