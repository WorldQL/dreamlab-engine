export const EPSILON = 0.00001;

function clamp01(value: number): number {
  if (value < 0) return 0;
  if (value > 1) return 1;
  return value;
}

/**
 * Interpolates between `a` and `b` by `t`
 *
 * `t` is clamped between 0 and 1.
 */
export function lerp(a: number, b: number, t: number): number {
  return a + (b - a) * clamp01(t);
}

/**
 * Interpolates between `a` and `b` by `t` without clamping `t`
 */
export function lerpUnclamped(a: number, b: number, t: number): number {
  return a + (b - a) * t;
}

const TAU = Math.PI * 2;

/**
 * Same as {@link lerp} but makes sure the values interpolate correctly when they wrap around 360 degrees
 */
export function lerpAngle(a: number, b: number, t: number): number {
  let delta = (b - a) % TAU;
  if (delta > Math.PI) delta -= TAU;
  return a + delta * clamp01(t);
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
