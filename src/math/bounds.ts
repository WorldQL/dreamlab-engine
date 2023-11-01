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
  const size = Vec.create(width, height)
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

export const rectangleBounds = (
  width: number,
  height: number,
  rotation: number,
): Bounds => {
  // Fast path for no rotation
  if (rotation % 360 === 0) {
    return { width, height }
  }

  const radians = toRadians(rotation)
  const ux = Math.cos(radians)
  const uy = Math.sin(radians)

  const wx = width * ux
  const wy = width * uy
  const hx = height * -uy
  const hy = height * ux

  if (ux > 0) {
    return uy > 0
      ? { width: wx - hx, height: hy + wy }
      : { width: wx + hx, height: hy - wy }
  }

  return uy > 0
    ? { width: 0 - (hx + wx), height: wy - hy }
    : { width: hx - wx, height: 0 - (wy + hy) }
}

export const boundsFromBodies = (...bodies: Matter.Body[]): Bounds => {
  if (bodies.length === 0) {
    throw new Error('must specify at least 1 body')
  }

  const maxX = Math.max(
    ...bodies.map(body =>
      body.vertices.reduce(
        (acc, verts) => Math.max(acc, verts.x),
        body.vertices[0]!.x,
      ),
    ),
  )

  const maxY = Math.max(
    ...bodies.map(body =>
      body.vertices.reduce(
        (acc, verts) => Math.max(acc, verts.y),
        body.vertices[0]!.y,
      ),
    ),
  )

  const minX = Math.min(
    ...bodies.map(body =>
      body.vertices.reduce(
        (acc, verts) => Math.min(acc, verts.x),
        body.vertices[0]!.x,
      ),
    ),
  )

  const minY = Math.min(
    ...bodies.map(body =>
      body.vertices.reduce(
        (acc, verts) => Math.min(acc, verts.y),
        body.vertices[0]!.y,
      ),
    ),
  )

  const width = maxX - minX
  const height = maxY - minY

  // TODO: WIP, not perfect
  return { width, height }
}
