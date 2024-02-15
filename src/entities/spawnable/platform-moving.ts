import Matter from 'matter-js'
import type { Time } from '~/entity'
import { game } from '~/labs/magic'
import type { SpawnableContext } from '~/spawnable/spawnableEntity'
import type { ArgsSchema } from './nonsolid'
import { Solid } from './solid'

type Args = typeof ArgsSchema

export class MovingPlatform<A extends Args = Args> extends Solid<A> {
  private count = 0

  public constructor(ctx: SpawnableContext<A>) {
    super(ctx)

    if (!this.tags.includes('net/replicated')) {
      this.tags.push('net/replicated', 'net/server-authoritative')
    }

    Matter.Body.setVelocity(this.body, { x: 5, y: 0 })

    const $client = game('client')
    if ($client) {
      $client.events.client.on('onPlayerCollisionActive', ([player, other]) => {
        if (other.id === this.body.id) {
          Matter.Body.translate(player.body, { x: this.body.velocity.x, y: 0 })
        }
      })
    }
  }

  public override onPhysicsStep(_time: Time): void {
    const $server = game('server')

    if ($server) {
      Matter.Body.translate(this.body, { x: this.body.velocity.x, y: 0 })

      this.count++

      if (this.count % 200 === 0) {
        Matter.Body.setVelocity(this.body, { x: -this.body.velocity.x, y: 0 })
      }
    }
  }
}
