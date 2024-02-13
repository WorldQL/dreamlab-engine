import Matter from 'matter-js'
import { physics } from '~/labs/magic'
import { toRadians } from '~/math/general'
import type { Vector } from '~/math/vector'
import { NonSolid } from './nonsolid'

export class Solid extends NonSolid {
  protected readonly body: Matter.Body

  public constructor(ctx: ConstructorParameters<typeof NonSolid>[0]) {
    super(ctx, { stroke: 'red' })

    this.body = Matter.Bodies.rectangle(
      this.transform.position.x,
      this.transform.position.y,
      this.args.width,
      this.args.height,
      {
        label: 'solid',
        render: { visible: false },
        angle: toRadians(this.transform.rotation),

        isStatic: true,
        // isSensor: preview,
        friction: 0,
      },
    )

    physics().register(this, this.body)
    physics().linkTransform(this.body, this.transform)
  }

  public override isPointInside(point: Vector): boolean {
    return Matter.Query.point([this.body], point).length > 0
  }

  public override teardown(): void {
    super.teardown()

    physics().unregister(this, this.body)
    physics().unlinkTransform(this.body, this.transform)
  }
}
