import type { Container } from 'pixi.js'
import type { Camera } from '~/entities/camera'
import type { Game } from '~/game'
import type { Physics } from '~/physics'

export interface InitContext {
  game: Game<boolean>
  physics: Physics
}

export interface InitRenderContext {
  // NOTE: Do we want to include a reference to game here?
  container: HTMLDivElement
  canvas: HTMLCanvasElement
  stage: Container
  camera: Camera
}

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

  // NOTE: Do we want to support shared/client/server init?
  // How would that work with teardown?
  // Do we want to enforce all of them to be implemented?
  public abstract init(ctx: InitContext): Promise<void> | void
  public abstract initRender(ctx: InitRenderContext): Promise<void> | void

  // NOTE: Is there a better way of marking these as optional to implement
  public onPhysicsStep(time: Time): void {
    // NOTE: Is there a better way of telling TS these should be used?
    void time
  }

  public onRenderFrame(time: RenderTime): void {
    void time
  }

  public abstract teardown(): Promise<void> | void
  public abstract teardownRender(): Promise<void> | void
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
