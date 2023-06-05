import { Buffer } from 'buffer/'
import { makeCCW, quickDecomp } from 'poly-decomp-es'
import type { Polygon } from 'poly-decomp-es'
import { truncateFloat } from '~/math/general.js'
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

export const calculatePolygons = (
  points: Vector[],
  truncate = 5,
): Vector[][] => {
  if (isPolygonConvex(points)) return [points]

  const tuplePoints: Polygon = points.map(({ x, y }) => [x, y])
  makeCCW(tuplePoints)

  const decomposed = quickDecomp(tuplePoints)
  return decomposed.map(polygon =>
    polygon.map(polygon => {
      const x = truncateFloat(polygon[0], truncate)
      const y = truncateFloat(polygon[1], truncate)

      return Vector.create(x, y)
    }),
  )
}

const bytes = {
  uint8: 1,
  uint16: 2,
  uint32: 4,

  float: 4,
  double: 8,
} as const

export const encodePolygons = (polygon: Vector[][]): string => {
  PolygonSchema.parse(polygon)

  const polygons = polygon.length
  const pointCount = polygon.reduce((acc, points) => acc + points.length * 2, 0)

  const headerSize = bytes.uint16
  const polySize = polygons * bytes.uint16 + pointCount * bytes.float
  const bufferSize = headerSize + polySize
  const buffer = Buffer.alloc(bufferSize)

  let idx = buffer.writeUInt16LE(polygons, 0)
  for (const points of polygon) {
    idx = buffer.writeUInt16LE(points.length, idx)

    for (const { x, y } of points) {
      idx = buffer.writeFloatLE(x, idx)
      idx = buffer.writeFloatLE(y, idx)
    }
  }

  return buffer.toString('base64')
}

export const decodePolygons = (data: string): Vector[][] => {
  const buffer = Buffer.from(data, 'base64')
  const polygonCount = buffer.readUInt16LE(0)

  const polygons: Vector[][] = []
  let offset = bytes.uint16
  for (let idx = 0; idx < polygonCount; idx++) {
    const points: Vector[] = []

    const pointsCount = buffer.readUInt16LE(offset)
    offset += bytes.uint16

    for (let pointIdx = 0; pointIdx < pointsCount; pointIdx++) {
      const x = buffer.readFloatLE(offset)
      offset += bytes.float

      const y = buffer.readFloatLE(offset)
      offset += bytes.float

      points.push(Vector.create(x, y))
    }

    polygons.push(points)
  }

  return polygons
}
