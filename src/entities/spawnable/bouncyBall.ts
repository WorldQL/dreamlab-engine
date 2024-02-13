import Matter from 'matter-js'
import { Container, Graphics } from 'pixi.js'
import type { Sprite } from 'pixi.js'
import { z } from 'zod'
import type { Camera } from '~/entities/camera.js'
import type { InitContext, InitRenderContext, RenderTime } from '~/entity'
import type { Bounds } from '~/math/bounds'
import { toRadians } from '~/math/general.js'
import { Vec } from '~/math/vector.js'
import type { Physics } from '~/physics.js'
import type { PreviousArgs } from '~/spawnable/spawnableEntity.js'
import { SpawnableEntity } from '~/spawnable/spawnableEntity.js'
import { createSprite, SpriteSourceSchema } from '~/textures/sprites.js'
import type { Debug } from '~/utils/debug.js'
import { drawCircle } from '~/utils/draw.js'

type Args = typeof ArgsSchema
export const ArgsSchema = z.object({
  radius: z.number().positive().min(1).default(60),
  spriteSource: SpriteSourceSchema.optional(),
})

export class BouncyBall extends SpawnableEntity<typeof ArgsSchema> {
  private declare debug: Debug
  private declare physics: Physics

  private declare body: Matter.Body
  private declare camera: Camera
  private declare container: Container
  private declare gfx: Graphics
  private declare sprite: Sprite | undefined

  public override bounds(): Bounds | undefined {
    const { radius } = this.args
    return { width: radius * 2, height: radius * 2 }
  }

  public override isPointInside(point: Matter.Vector): boolean {
    return Matter.Query.point([this.body], point).length > 0
  }

  public override init({ game, physics }: InitContext): void {
    this.debug = game.debug
    this.physics = physics

    const { transform, args, preview } = this
    const mass = 20

    this.body = Matter.Bodies.circle(
      transform.position.x,
      transform.position.y,
      args.radius,
      {
        label: 'bouncyBall',
        render: { visible: false },
        angle: toRadians(transform.rotation),
        isStatic: preview,
        isSensor: preview,

        mass,
        inverseMass: 1 / mass,
        restitution: 0.95,
      },
    )

    physics.register(this, this.body)
    physics.linkTransform(this.body, transform)

    if (!this.tags.includes('net/replicated')) {
      this.tags.push('net/replicated')
    }
  }

  public override initRender({ stage, camera }: InitRenderContext): void {
    this.camera = camera

    const { transform, args } = this
    const { radius, spriteSource } = args

    this.container = new Container()
    this.container.sortableChildren = true
    this.container.zIndex = transform.zIndex

    this.gfx = new Graphics()
    this.gfx.zIndex = 100
    drawCircle(this.gfx, { radius })

    const width = radius * 2
    const height = radius * 2
    this.sprite = spriteSource
      ? createSprite(spriteSource, { width, height })
      : undefined

    this.container.addChild(this.gfx)
    if (this.sprite) this.container.addChild(this.sprite)
    stage.addChild(this.container)

    transform.addZIndexListener(() => {
      this.container.zIndex = transform.zIndex
    })
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

  public override teardown(): Promise<void> | void {
    this.physics.unregister(this, this.body)
    this.physics.unlinkTransform(this.body, this.transform)
  }

  public override teardownRender(): Promise<void> | void {
    this.container.destroy({ children: true })
  }

  public override onRenderFrame({ smooth }: RenderTime): void {
    const smoothed = Vec.add(
      this.body.position,
      Vec.mult(this.body.velocity, smooth),
    )

    const pos = Vec.add(smoothed, this.camera.offset)

    this.container.position = pos
    this.container.rotation = this.body.angle
    this.gfx.alpha = this.debug.value ? 0.5 : 0
  }
}
