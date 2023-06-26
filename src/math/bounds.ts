import { Vector } from 'matter-js'
import { toRadians } from './general.js'
import type { Transform } from './transform.js'

export const simpleBoundsTest = (
  width: number,
  height: number,
  transform: Transform,
  point: Vector,
): boolean => {
  // TODO: Optimise with quick bounds check

  const radians = toRadians(transform.rotation)
  const angle_sin = Math.sin(radians)
  const angle_cos = Math.cos(radians)

  const x =
    (point.x - transform.position.x) * angle_cos -
    (point.y - transform.position.y) * angle_sin +
    transform.position.x

  const y =
    (point.x - transform.position.x) * angle_sin +
    (point.y - transform.position.y) * angle_cos +
    transform.position.y

  const half = Vector.create(width / 2, height / 2)
  const { x: minX, y: minY } = Vector.sub(transform.position, half)
  const { x: maxX, y: maxY } = Vector.add(transform.position, half)

  return x >= minX && x <= maxX && y >= minY && y <= maxY
}
