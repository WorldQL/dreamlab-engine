import Matter from 'matter-js'
import type { Vector } from 'matter-js'
import { z } from 'zod'
import type { Time } from '~/entity'
import { physics } from '~/labs/magic'
import type { SpawnableContext } from '~/spawnable/spawnableEntity'
import { ArgsSchema } from './nonsolid'
import { Solid } from './solid'

type Args = typeof ForceFieldArgsSchema
export const ForceFieldArgsSchema = ArgsSchema.extend({
  force: z.number().default(20),
})

export class ForceField<A extends Args = Args> extends Solid<A> {
  public constructor(ctx: SpawnableContext<A>) {
    super(ctx)
    this.body.isSensor = true
  }

  public override onPhysicsStep(time: Time): void {
    const collisions = Matter.Query.collides(this.body, physics().world.bodies)
    const bodies = collisions
      .filter(x => x.bodyA.id !== x.bodyB.id)
      .map(x => (x.bodyA.id === this.body.id ? x.bodyB : x.bodyA))
      .filter(body => !body.isSensor)
      .filter(body => !body.isStatic)

    if (bodies.length === 0) return
    const magnitude = this.args.force * time.delta
    const angle = this.body.angle - Math.PI / 2
    const force: Vector = {
      x: Math.cos(angle) * magnitude,
      y: Math.sin(angle) * magnitude,
    }

    for (const body of bodies) {
      Matter.Body.applyForce(body, body.position, force)
    }
  }
}
