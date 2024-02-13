import Matter from 'matter-js'
import type { InitContext } from '~/entity'
import { toRadians } from '~/math/general'
import type { Vector } from '~/math/vector'
import type { Physics } from '~/physics'
import { NonSolid } from './nonsolid'

export class Solid extends NonSolid {
  protected override readonly stroke = 'red'

  protected declare physics: Physics
  protected declare body: Matter.Body

  public override isPointInside(point: Vector): boolean {
    return Matter.Query.point([this.body], point).length > 0
  }

  public override init(ctx: InitContext): void {
    super.init(ctx)
    const { transform, args } = this

    this.body = Matter.Bodies.rectangle(
      transform.position.x,
      transform.position.y,
      args.width,
      args.height,
      {
        label: 'solid',
        render: { visible: false },
        angle: toRadians(transform.rotation),

        isStatic: true,
        // isSensor: preview,
        friction: 0,
      },
    )

    this.physics = ctx.physics
    this.physics.register(this, this.body)
    this.physics.linkTransform(this.body, this.transform)
  }

  public override teardown(): void {
    super.teardown()

    this.physics.unregister(this, this.body)
    this.physics.unlinkTransform(this.body, this.transform)
  }
}
