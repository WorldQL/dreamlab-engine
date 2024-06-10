import { Vector2 } from "../math/vector.ts";

export const EPSILON = 0.00001;

export function lerp(a: number, b: number, t: number): number {
  return a + (b - a) * t;
}

export function lerp2(a: Vector2, b: Vector2, t: number): Vector2 {
  const x = lerp(a.x, b.x, t);
  const y = lerp(a.y, b.y, t);
  return new Vector2(x, y);
}

export function smoothLerp(
  current: number,
  target: number,
  decay: number,
  deltaTime: number,
  epsilon = EPSILON
): number {
  if (Math.abs(target - current) < epsilon) {
    return target;
  }

  return target + (current - target) * Math.exp(-decay * deltaTime);
}

export function smoothLerp2(
  current: Vector2,
  target: Vector2,
  decay: number,
  deltaTime: number,
  epsilon = EPSILON
): Vector2 {
  const x = smoothLerp(current.x, target.x, decay, deltaTime, epsilon);
  const y = smoothLerp(current.y, target.y, decay, deltaTime, epsilon);
  return new Vector2(x, y);
}
