import Matter from 'matter-js'
import type { InitContext, InitRenderContext } from '~/entity'
import { Entity } from '~/entity'
import type { Bounds } from '~/math/bounds'

export abstract class BasePlayer extends Entity {
  private static readonly PLAYER_MASS = 50

  public readonly body: Matter.Body

  public constructor(
    _characterId: string | undefined,
    { width = 80, height = 370 }: Partial<Bounds> = {},
  ) {
    super()

    this.body = Matter.Bodies.rectangle(0, 0, width, height, {
      label: 'player',
      render: { visible: false },

      inertia: Number.POSITIVE_INFINITY,
      inverseInertia: 0,
      mass: BasePlayer.PLAYER_MASS,
      inverseMass: 1 / BasePlayer.PLAYER_MASS,
      friction: 0,

      collisionFilter: {
        category: 0x002,
      },
    })

    // TODO: Implement BasePlayer
  }

  public override init(_ctx: InitContext): Promise<void> | void {
    throw new Error('not implemented')
  }

  public override initRender(_ctx: InitRenderContext): Promise<void> | void {
    throw new Error('not implemented')
  }

  public override teardown(): Promise<void> | void {
    throw new Error('not implemented')
  }

  public override teardownRender(): Promise<void> | void {
    throw new Error('not implemented')
  }
}
