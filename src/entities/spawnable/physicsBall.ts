import * as particles from '@pixi/particle-emitter'
import Matter from 'matter-js'
import type { Sprite } from 'pixi.js'
import { Container, Graphics, ParticleContainer } from 'pixi.js'
import { z } from 'zod'
import type { RenderTime } from '~/entity'
import { camera, debug, game, physics, stage } from '~/labs/magic'
import type { Bounds } from '~/math/bounds'
import { toRadians } from '~/math/general.js'
import { Vec } from '~/math/vector.js'
import { updateSpriteSource } from '~/spawnable/args'
import type {
  PreviousArgs,
  SpawnableContext,
} from '~/spawnable/spawnableEntity.js'
import { SpawnableEntity } from '~/spawnable/spawnableEntity.js'
import { createSprite, SpriteSourceSchema } from '~/textures/sprites.js'
import type { CircleGraphics } from '~/utils/draw.js'
import { drawCircle } from '~/utils/draw.js'

type Args = typeof ArgsSchema
const ArgsSchema = z.object({
  radius: z.number().positive().min(1).default(60),
  spriteSource: SpriteSourceSchema.optional(),
})

export { ArgsSchema as PhysicsBallArgs }
export class PhysicsBall extends SpawnableEntity<Args> {
  private static MASS = 20
  private static PARTICLE_THRESHOLD = 2

  protected readonly body: Matter.Body
  protected readonly container: Container | undefined
  protected readonly mask: CircleGraphics | undefined
  protected readonly gfx: CircleGraphics | undefined
  protected sprite: Sprite | undefined

  protected readonly particleContainer: ParticleContainer | undefined
  private readonly emitter: particles.Emitter | undefined

  public constructor(ctx: SpawnableContext<Args>) {
    super(ctx)

    this.body = Matter.Bodies.circle(
      this.transform.position.x,
      this.transform.position.y,
      this.args.radius,
      {
        label: 'physicsBall',
        render: { visible: false },
        angle: toRadians(this.transform.rotation),
        isStatic: this.preview,
        isSensor: this.preview,

        mass: PhysicsBall.MASS,
        inverseMass: 1 / PhysicsBall.MASS,
        restitution: 0.95,
      },
    )

    physics().register(this, this.body)
    physics().linkTransform(this.body, this.transform)

    if (!this.tags.includes('net/replicated')) {
      this.tags.push('net/replicated')
    }

    const $game = game('client')
    if ($game) {
      const { radius, spriteSource } = this.args

      this.container = new Container()
      this.container.sortableChildren = true
      this.container.zIndex = this.transform.zIndex

      this.particleContainer = new ParticleContainer()

      this.gfx = drawCircle({ radius })
      this.gfx.zIndex = 100

      this.mask = drawCircle(
        { radius },
        { strokeAlpha: 0, fillAlpha: 0, fill: 'transparent' },
      )

      const width = radius * 2
      const height = radius * 2
      this.sprite = spriteSource
        ? createSprite(spriteSource, { width, height })
        : undefined

      if (this.sprite) this.sprite.mask = this.mask

      this.container.addChild(this.gfx)
      this.container.addChild(this.mask)
      if (this.sprite) this.container.addChild(this.sprite)
      stage().addChild(this.container)
      stage().addChild(this.particleContainer)

      const goldDotTexture = $game.client.render.app.renderer.generateTexture(
        new Graphics().beginFill(0xffd700).drawCircle(0, 0, 5).endFill(),
      )
      this.emitter = new particles.Emitter(this.particleContainer, {
        lifetime: {
          min: 0.5,
          max: 0.5,
        },
        frequency: 0.008,
        spawnChance: 1,
        particlesPerWave: 1,
        emitterLifetime: 10,
        maxParticles: 200,
        pos: {
          x: 0,
          y: 0,
        },
        addAtBack: false,
        behaviors: [
          {
            type: 'scale',
            config: {
              scale: {
                list: [
                  {
                    value: 0.5,
                    time: 0,
                  },
                  {
                    value: 0.1,
                    time: 1,
                  },
                ],
              },
            },
          },
          {
            type: 'moveSpeed',
            config: {
              speed: {
                list: [
                  {
                    value: 200,
                    time: 0,
                  },
                  {
                    value: 100,
                    time: 1,
                  },
                ],
                isStepped: false,
              },
            },
          },
          {
            type: 'rotationStatic',
            config: {
              min: 0,
              max: 360,
            },
          },
          {
            type: 'spawnShape',
            config: {
              type: 'torus',
              data: {
                x: 0,
                y: 0,
                radius: 10,
              },
            },
          },
          {
            type: 'textureSingle',
            config: { texture: goldDotTexture },
          },
        ],
      })

      this.transform.addZIndexListener(() => {
        if (this.container) this.container.zIndex = this.transform.zIndex
        if (this.particleContainer)
          this.particleContainer.zIndex = this.transform.zIndex
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
    path: string,
    previousArgs: PreviousArgs<Args>,
  ): void {
    const bounds = { width: this.args.radius * 2, height: this.args.radius * 2 }

    if (path === 'radius') {
      if (this.gfx) this.gfx.redraw(this.args)
      if (this.sprite) {
        this.sprite.width = bounds.width
        this.sprite.height = bounds.height
      }
    }

    this.sprite = updateSpriteSource(
      path,
      'spriteSource',
      this.container,
      this.sprite,
      this.args.spriteSource,
      bounds,
    )

    if (this.sprite && this.mask) {
      this.mask.redraw(this.args)
      this.sprite.mask = this.mask
    }

    const angle = this.body.angle
    const scale = this.args.radius / previousArgs.radius

    Matter.Body.setAngle(this.body, 0)
    Matter.Body.scale(this.body, scale, scale)
    Matter.Body.setAngle(this.body, angle)
    Matter.Body.setMass(this.body, PhysicsBall.MASS)
  }

  public override onResize({ width, height }: Bounds): void {
    this.args.radius = Math.max(width / 2, height / 2)
  }

  public override teardown(): void {
    physics().unregister(this, this.body)
    physics().unlinkTransform(this.body, this.transform)

    this.container?.destroy({ children: true })
    this.particleContainer?.destroy({ children: true })
  }

  public override onRenderFrame(time: RenderTime): void {
    this.emitter?.update(time.delta)

    if (this.container && this.particleContainer) {
      const smoothed = Vec.add(
        this.body.position,
        Vec.mult(this.body.velocity, time.smooth),
      )

      const pos = Vec.add(smoothed, camera().offset)
      this.container.position = pos
      this.container.rotation = this.body.angle

      this.particleContainer.position = camera().offset

      if (this.emitter) {
        const velocityMagnitude = Math.hypot(
          this.body.velocity.x,
          this.body.velocity.y,
        )

        if (velocityMagnitude > PhysicsBall.PARTICLE_THRESHOLD) {
          this.emitter.emit = true
          this.emitter.updateSpawnPos(smoothed.x, smoothed.y + this.args.radius)
        } else {
          this.emitter.emit = false
        }
      }
    }

    if (this.gfx) this.gfx.alpha = debug() ? 0.5 : 0
  }
}
