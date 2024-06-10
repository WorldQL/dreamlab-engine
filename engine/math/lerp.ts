export const EPSILON = 0.00001;

export function lerp(a: number, b: number, t: number): number {
  return a + (b - a) * t;
}

export function smoothLerp(
  current: number,
  target: number,
  decay: number,
  deltaTime: number,
  epsilon = EPSILON,
): number {
  if (Math.abs(target - current) < epsilon) {
    return target;
  }

  return target + (current - target) * Math.exp(-decay * deltaTime);
}
