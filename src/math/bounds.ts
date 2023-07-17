import { toRadians } from '~/math/general.js'
import type { Transform } from '~/math/transform.js'
import { Vec } from '~/math/vector.js'
import type { Vector } from '~/math/vector.js'

const fastBoundsTest = (
  width: number,
  height: number,
  position: Vector,
  { x, y }: Vector,
): boolean => {
  const size = Vec.create(width, height)
  const { x: minX, y: minY } = Vec.sub(position, size)
  const { x: maxX, y: maxY } = Vec.add(position, size)

  return x >= minX && x <= maxX && y >= minY && y <= maxY
}

export const simpleBoundsTest = (
  width: number,
  height: number,
  transform: Transform,
  point: Vector,
): boolean => {
  const fast = fastBoundsTest(width, height, transform.position, point)
  if (!fast) return false

  const radians = toRadians(transform.rotation)
  const sin = Math.sin(radians)
  const cos = Math.cos(radians)

  const x =
    (point.x - transform.position.x) * cos -
    (point.y - transform.position.y) * sin +
    transform.position.x

  const y =
    (point.x - transform.position.x) * sin +
    (point.y - transform.position.y) * cos +
    transform.position.y

  const half = Vec.create(width / 2, height / 2)
  const { x: minX, y: minY } = Vec.sub(transform.position, half)
  const { x: maxX, y: maxY } = Vec.add(transform.position, half)

  return x >= minX && x <= maxX && y >= minY && y <= maxY
}
