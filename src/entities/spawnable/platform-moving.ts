import Matter from 'matter-js'
import { z } from 'zod'
import type { Time } from '~/entity'
import { events, game } from '~/labs/magic'
import type { SpawnableContext } from '~/spawnable/spawnableEntity'
import { ArgsSchema } from './nonsolid'
import { Platform } from './platform'

type Args = typeof MovingPlatformArgs
export const MovingPlatformArgs = ArgsSchema.extend({
  changeDirectionEveryNTicks: z.number().default(200),
})

export class MovingPlatform<A extends Args = Args> extends Platform<A> {
  private count = 0

  public constructor(ctx: SpawnableContext<A>) {
    super(ctx)

    if (!this.tags.includes('net/replicated')) {
      this.tags.push('net/replicated', 'net/server-authoritative')
    }

    Matter.Body.setVelocity(this.body, { x: 5, y: 0 })

    events('client')?.on('onPlayerCollisionActive', ([player, other]) => {
      if (other.id === this.body.id) {
        Matter.Body.translate(player.body, { x: this.body.velocity.x, y: 0 })
      }
    })
  }

  public override onPhysicsStep(time: Time): void {
    super.onPhysicsStep(time)
    const $server = game('server')

    if ($server) {
      Matter.Body.translate(this.body, { x: this.body.velocity.x, y: 0 })

      this.count++

      if (this.count % this.args.changeDirectionEveryNTicks === 0) {
        Matter.Body.setVelocity(this.body, { x: -this.body.velocity.x, y: 0 })
      }
    }
  }
}
