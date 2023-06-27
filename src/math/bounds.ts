import { toRadians } from './general.js'
import type { Transform } from './transform.js'
import { Vec } from '~/math/vector.js'
import type { Vector } from '~/math/vector.js'

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

  const half = Vec.create(width / 2, height / 2)
  const { x: minX, y: minY } = Vec.sub(transform.position, half)
  const { x: maxX, y: maxY } = Vec.add(transform.position, half)

  return x >= minX && x <= maxX && y >= minY && y <= maxY
}
