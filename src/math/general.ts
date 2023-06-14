/* eslint-disable id-length */
export const toRadians = (degrees: number): number => degrees * (Math.PI / 180)
export const toDegrees = (radians: number): number => radians * (180 / Math.PI)

export const truncateFloat = (num: number, places = 5): number => {
  const power = 10 ** places
  return Math.round((num + Number.EPSILON) * power) / power
}

export const lerp = (a: number, b: number, t: number): number => a + (b - a) * t
