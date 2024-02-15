import Matter from 'matter-js'
import type { Time } from '~/entity'
import { game, physics } from '~/labs/magic'
import type { SpawnableContext } from '~/spawnable/spawnableEntity'
import { isPlayer } from '../player'
import type { ArgsSchema } from './nonsolid'
import { Platform } from './platform'
import { Solid } from './solid'

type Args = typeof ArgsSchema

export class MovingPlatform<A extends Args = Args> extends Platform<A> {
  public platformSpeed = 5

  public constructor(ctx: SpawnableContext<A>) {
    super(ctx)

    if (!this.tags.includes('net/replicated')) {
      this.tags.push('net/replicated', 'net/server-authoritative')
    }

    const $client = game('client')

    if ($client) {
      $client.events.client.on('onPlayerCollisionActive', event => {
        const player = event[0]
        const other = event[1]

        if (other.id === this.body.id) {
          Matter.Body.translate(player.body, { x: this.platformSpeed, y: 0 })
        }
      })
    }
  }

  public override onPhysicsStep(time: Time): void {
    super.onPhysicsStep(time)
    const $game = game('client')
    if ($game) {
      Matter.Body.translate(this.body, {
        x: this.platformSpeed,
        y: 0,
      })
    }
  }
}
