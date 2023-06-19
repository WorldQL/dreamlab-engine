import { Buffer } from 'buf'
import { Vertices } from 'matter-js'
import pako from 'pako'
import { makeCCW, quickDecomp } from 'poly-decomp-es'
import type { Polygon } from 'poly-decomp-es'
import type { z } from 'zod'
import { truncateVector, Vector, VectorSchema } from '~/math/vector.js'

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

type Points = z.infer<typeof PointsSchema>
const PointsSchema = VectorSchema.array()

type Polygons = z.infer<typeof PolygonsSchema>
const PolygonsSchema = VectorSchema.array().array()

export const calculatePolygons = (
  points: Points,
  truncate = 5,
): readonly [center: Vector, polygons: Polygons] => {
  // ensure correct schema
  PointsSchema.parse(points)

  const center = truncateVector(Vertices.centre(points))
  const offsetPoints = points.map(point => Vector.sub(point, center))

  if (isPolygonConvex(offsetPoints)) {
    return [center, [offsetPoints]]
  }

  const tuplePoints: Polygon = offsetPoints.map(({ x, y }) => [x, y])
  makeCCW(tuplePoints)

  const decomposed = quickDecomp(tuplePoints)
  const polygons = decomposed.map(polygon =>
    polygon.map(([x, y]) => truncateVector(Vector.create(x, y), truncate)),
  )

  return [center, polygons]
}

const bytes = {
  uint8: 1,
  uint16: 2,
  uint32: 4,

  float: 4,
  double: 8,
} as const

export const encodePolygons = (polygons: Polygons, double = false): string => {
  PolygonsSchema.parse(polygons)

  const polygonCount = polygons.length
  const pointCount = polygons.reduce(
    (acc, points) => acc + points.length * 2,
    0,
  )

  const headerSize = bytes.uint8 + bytes.uint16
  const floatSize = double ? bytes.double : bytes.float
  const polySize = polygonCount * bytes.uint16 + pointCount * floatSize
  const bufferSize = headerSize + polySize
  const buffer = Buffer.alloc(bufferSize)

  let idx = buffer.writeUInt8(double ? 1 : 0, 0)
  idx = buffer.writeUInt16LE(polygonCount, idx)

  for (const points of polygons) {
    idx = buffer.writeUInt16LE(points.length, idx)

    for (const { x, y } of points) {
      if (double) {
        idx = buffer.writeDoubleLE(x, idx)
        idx = buffer.writeDoubleLE(y, idx)
      } else {
        idx = buffer.writeFloatLE(x, idx)
        idx = buffer.writeFloatLE(y, idx)
      }
    }
  }

  const deflate = Buffer.from(pako.deflate(buffer))
  return deflate.toString('base64')
}

export const decodePolygons = (data: string): Polygons => {
  const buf = Buffer.from(data, 'base64')
  const buffer = Buffer.from(pako.inflate(buf))

  const double = buffer.readUInt8(0)
  const floatSize = double ? bytes.double : bytes.float

  const polygonCount = buffer.readUInt16LE(bytes.uint8)
  const polygons: Vector[][] = []

  let offset = bytes.uint8 + bytes.uint16
  for (let idx = 0; idx < polygonCount; idx++) {
    const points: Vector[] = []

    const pointsCount = buffer.readUInt16LE(offset)
    offset += bytes.uint16

    for (let pointIdx = 0; pointIdx < pointsCount; pointIdx++) {
      const x = double
        ? buffer.readDoubleLE(offset)
        : buffer.readFloatLE(offset)

      offset += floatSize

      const y = double
        ? buffer.readDoubleLE(offset)
        : buffer.readFloatLE(offset)

      offset += floatSize

      points.push(Vector.create(x, y))
    }

    polygons.push(points)
  }

  return polygons
}
