import { decode, encode } from '@msgpack/msgpack'
import { fromByteArray, toByteArray } from 'base64-js'
import { makeCCW, quickDecomp } from 'poly-decomp-es'
import type { Polygon } from 'poly-decomp-es'
import { Vector, VectorSchema } from '~/math/vector.js'

const PolygonSchema = VectorSchema.array().array()

const isPolygonConvex = (vertices: Vector[]): boolean => {
  const len = vertices.length
  if (len < 3) {
    // A polygon must have at least 3 vertices
    return false
  }

  let crossProductSign = 0
  for (let idx = 0; idx < len; idx++) {
    const p1 = vertices[idx]!
    const p2 = vertices[(idx + 1) % len]!
    const p3 = vertices[(idx + 2) % len]!

    const crossProduct =
      (p2.x - p1.x) * (p3.y - p2.y) - (p2.y - p1.y) * (p3.x - p2.x)

    if (crossProduct === 0) {
      // Collinear points, continue to the next edge
      continue
    }

    if (crossProductSign === 0) {
      crossProductSign = Math.sign(crossProduct)
    } else if (Math.sign(crossProduct) !== crossProductSign) {
      // Cross products have different signs, the polygon is concave
      return false
    }
  }

  // All cross products have the same sign, the polygon is convex
  return true
}

export const calculatePolygons = (points: Vector[]): Vector[][] => {
  if (isPolygonConvex(points)) return [points]

  const tuplePoints: Polygon = points.map(({ x, y }) => [x, y])
  makeCCW(tuplePoints)

  const decomposed = quickDecomp(tuplePoints)
  return decomposed.map(polygon => polygon.map(([x, y]) => Vector.create(x, y)))
}

export const encodePolygons = (polygon: Vector[][]): string => {
  PolygonSchema.parse(polygon)

  const encoded = encode(polygon)
  return fromByteArray(encoded)
}

export const decodePolygons = (data: string): Vector[][] => {
  const encoded = toByteArray(data)
  const polygon = decode(encoded)

  return PolygonSchema.parse(polygon)
}
