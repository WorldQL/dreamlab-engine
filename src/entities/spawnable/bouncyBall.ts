import Matter from 'matter-js'
import { Container } from 'pixi.js'
import type { Sprite } from 'pixi.js'
import { z } from 'zod'
import type { RenderTime } from '~/entity'
import { camera, debug, game, physics, stage } from '~/labs/magic'
import type { Bounds } from '~/math/bounds'
import { toRadians } from '~/math/general.js'
import { Vec } from '~/math/vector.js'
import type {
  PreviousArgs,
  SpawnableContext,
} from '~/spawnable/spawnableEntity.js'
import { SpawnableEntity } from '~/spawnable/spawnableEntity.js'
import { createSprite, SpriteSourceSchema } from '~/textures/sprites.js'
import type { CircleGraphics } from '~/utils/draw.js'
import { drawCircle } from '~/utils/draw.js'

type Args = typeof ArgsSchema
export const ArgsSchema = z.object({
  radius: z.number().positive().min(1).default(60),
  spriteSource: SpriteSourceSchema.optional(),
})

export class BouncyBall extends SpawnableEntity<Args> {
  private readonly body: Matter.Body
  private readonly container: Container | undefined
  private readonly gfx: CircleGraphics | undefined
  private readonly sprite: Sprite | undefined

  public constructor(ctx: SpawnableContext<Args>) {
    super(ctx)

    const mass = 20
    this.body = Matter.Bodies.circle(
      this.transform.position.x,
      this.transform.position.y,
      this.args.radius,
      {
        label: 'bouncyBall',
        render: { visible: false },
        angle: toRadians(this.transform.rotation),
        isStatic: this.preview,
        isSensor: this.preview,

        mass,
        inverseMass: 1 / mass,
        restitution: 0.95,
      },
    )

    physics().register(this, this.body)
    physics().linkTransform(this.body, this.transform)

    if (!this.tags.includes('net/replicated')) {
      this.tags.push('net/replicated')
    }

    const _game = game('client')
    if (_game) {
      const { radius, spriteSource } = this.args

      this.container = new Container()
      this.container.sortableChildren = true
      this.container.zIndex = this.transform.zIndex

      this.gfx = drawCircle({ radius })
      this.gfx.zIndex = 100

      const width = radius * 2
      const height = radius * 2
      this.sprite = spriteSource
        ? createSprite(spriteSource, { width, height })
        : undefined

      this.container.addChild(this.gfx)
      if (this.sprite) this.container.addChild(this.sprite)
      stage().addChild(this.container)

      this.transform.addZIndexListener(() => {
        if (this.container) this.container.zIndex = this.transform.zIndex
      })
    }
  }

  public override bounds(): Bounds | undefined {
    const { radius } = this.args
    return { width: radius * 2, height: radius * 2 }
  }

  public override isPointInside(point: Matter.Vector): boolean {
    return Matter.Query.point([this.body], point).length > 0
  }

  public override onArgsUpdate(
    _path: string,
    _previousArgs: PreviousArgs<Args>,
  ): void {
    // TODO: Implement onArgsUpdate
    // if (render && path.startsWith('spriteSource')) {
    //   const { radius, spriteSource } = args
    //   const width = radius * 2
    //   const height = radius * 2
    //   render.sprite?.destroy()
    //   render.sprite = spriteSource
    //     ? createSprite(spriteSource, { width, height })
    //     : undefined
    //   if (render.sprite) render.container.addChild(render.sprite)
    // }
    // if (path === 'radius') {
    //   const originalRadius = previous.radius
    //   const radius = args.radius
    //   const scale = radius / originalRadius
    //   Matter.Body.setAngle(body, 0)
    //   Matter.Body.scale(body, scale, scale)
    //   Matter.Body.setAngle(body, toRadians(transform.rotation))
    //   Matter.Body.setMass(body, mass)
    //   if (render) {
    //     drawCircle(render.gfx, { radius })
    //     if (render.sprite) {
    //       render.sprite.width = radius * 2
    //       render.sprite.height = radius * 2
    //     }
    //   }
    // }
  }

  public override onResize({ width, height }: Bounds): void {
    this.args.radius = Math.max(width / 2, height / 2)
  }

  public override teardown(): void {
    physics().unregister(this, this.body)
    physics().unlinkTransform(this.body, this.transform)

    this.container?.destroy({ children: true })
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
