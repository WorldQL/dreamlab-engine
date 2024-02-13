export interface Time {
  /**
   * Time since the last physics tick or rendered frame, in seconds
   */
  delta: number

  /**
   * Monotonic clock representing the time since game start, in seconds
   */
  time: number
}

export interface RenderTime extends Time {
  /**
   * Physics smoothing factor
   */
  smooth: number
}

export const symbol = Symbol.for('@dreamlab/core/entity')
export abstract class Entity {
  // TODO: Write TSDoc for all methods and properties

  public readonly [symbol] = true as const
  public readonly priority?: number

  public abstract teardown(): void
}

export interface Entity {
  onPhysicsStep?(time: Time): void
  onRenderFrame(time: RenderTime): void
}

/**
 * Type guard to check if an object is of type {@link Entity}
 */
export const isEntity = (entity: unknown): entity is Entity => {
  if (entity === null) return false
  if (typeof entity === 'undefined') return false
  if (typeof entity !== 'object') return false

  return symbol in entity && entity[symbol] === true
}
