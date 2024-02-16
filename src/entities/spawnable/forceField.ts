import type { Vector } from 'matter-js'
import Matter from 'matter-js'
import { z } from 'zod'
import { events } from '~/labs/magic'
import type { SpawnableContext } from '~/spawnable/spawnableEntity'
import { deferUntilPhysicsStep } from '~/utils/defer'
import { NonSolidArgs } from './nonsolid'
import { Solid } from './solid'

type Args = typeof ArgsSchema
const ArgsSchema = NonSolidArgs.extend({
  force: z.number().default(20),
})

export { ArgsSchema as ForceFieldArgs }
export class ForceField<A extends Args = Args> extends Solid<A> {
  public constructor(ctx: SpawnableContext<A>) {
    super(ctx)

    this.body.isSensor = true

    events('client')?.on('onPlayerCollisionActive', ([player, other]) => {
      if (other.id === this.body.id) {
        deferUntilPhysicsStep(time => {
          const forceMagnitude = this.args.force * time.delta
          const angle = this.body.angle - Math.PI / 2
          const force: Vector = {
            x: Math.cos(angle) * forceMagnitude,
            y: Math.sin(angle) * forceMagnitude,
          }

          Matter.Body.applyForce(player.body, player.body.position, force)
        })
      }
    })
  }
}
