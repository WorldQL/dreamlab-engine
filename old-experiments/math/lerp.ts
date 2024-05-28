export const EPSILON = 0.00001;

/**
 * Framerate independent smooth linear interpolation.
 *
 * @param current Current value
 * @param target Target value
 * @param deltaTime Delta time (seconds)
 * @param halfLife Time until halfway (seconds)
 */
export function lerp(
  current: number,
  target: number,
  deltaTime: number,
  halfLife: number,
  epsilon = EPSILON,
): number {
  if (Math.abs(target - current) < epsilon) {
    return target;
  }

  return target + (current - target) * Math.pow(2, -deltaTime / halfLife);
}
