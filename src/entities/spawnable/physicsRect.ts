import Matter from 'matter-js'
import type { RenderTime } from '~/entity'
import { camera, debug, physics } from '~/labs/magic'
import { toRadians } from '~/math/general.js'
import { Vec } from '~/math/vector.js'
import { updateBodyWidthHeight } from '~/spawnable/args'
import type {
  PreviousArgs,
  SpawnableContext,
} from '~/spawnable/spawnableEntity.js'
import { NonSolid, NonSolidArgs } from './nonsolid'

type Args = typeof ArgsSchema
const ArgsSchema = NonSolidArgs.extend({
  // TODO: Give more args like restitution, friction, etc... ??
})

export { ArgsSchema as PhysicsRectArgs }
export class PhysicsRect<A extends Args = Args> extends NonSolid<A> {
  private static MASS = 20

  protected readonly body: Matter.Body

  public constructor(ctx: SpawnableContext<A>) {
    super(ctx, { stroke: 'red' })

    this.body = Matter.Bodies.rectangle(
      this.transform.position.x,
      this.transform.position.y,
      this.args.width,
      this.args.height,
      {
        label: 'physicsRect',
        render: { visible: false },
        angle: toRadians(this.transform.rotation),
        isStatic: this.preview,
        isSensor: this.preview,

        mass: PhysicsRect.MASS,
        inverseMass: 1 / PhysicsRect.MASS,
        restitution: 0.95,
      },
    )

    physics().register(this, this.body)
    physics().linkTransform(this.body, this.transform)

    if (!this.tags.includes('net/replicated')) {
      this.tags.push('net/replicated')
    }
  }

  public override isPointInside(point: Matter.Vector): boolean {
    return Matter.Query.point([this.body], point).length > 0
  }

  public override onArgsUpdate(
    path: string,
    previousArgs: PreviousArgs<Args>,
  ): void {
    super.onArgsUpdate(path, previousArgs)
    updateBodyWidthHeight(path, this.body, this.args, previousArgs)
  }

  public override teardown(): void {
    super.teardown()

    physics().unregister(this, this.body)
    physics().unlinkTransform(this.body, this.transform)
  }

  public override onRenderFrame({ smooth }: RenderTime): void {
    if (this.container) {
      const smoothed = Vec.add(
        this.body.position,
        Vec.mult(this.body.velocity, smooth),
      )

      const pos = Vec.add(smoothed, camera().offset)
      this.container.position = pos
      this.container.rotation = this.body.angle
    }

    if (this.gfx) this.gfx.alpha = debug() ? 0.5 : 0
  }
}
