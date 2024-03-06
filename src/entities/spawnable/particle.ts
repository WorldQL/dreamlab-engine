import type { Vector } from 'matter-js'
import { ParticleContainer } from 'pixi.js'
import { z } from 'zod'
import type { RenderTime } from '~/entity'
import type { ArgsPath, PreviousArgs, SpawnableContext } from '~/exports'
import { SpawnableEntity } from '~/exports'
import { particles } from '~/exports/utils'
import { camera, game, stage } from '~/labs/magic'
import type { Bounds } from '~/math/bounds'

const BehaviorConfigSchema = z.object({
  type: z.string(),
  config: z.record(z.any()),
})

const ParticleEmitterConfigSchema = z.object({
  lifetime: z.object({
    min: z.number().positive(),
    max: z.number().positive(),
  }),
  frequency: z.number().positive(),
  emitterLifetime: z.number(),
  spawnChance: z.number().min(0).max(1),
  particlesPerWave: z.number().int().positive(),
  maxParticles: z.number().int().positive(),
  addAtBack: z.boolean(),
  autoUpdate: z.boolean(),
  behaviors: z.array(BehaviorConfigSchema),
})

type Args = typeof ArgsSchema
const ArgsSchema = z.object({
  width: z.number().positive().min(1).default(100),
  height: z.number().positive().min(1).default(100),
  emitterConfig: ParticleEmitterConfigSchema,
})

export { ArgsSchema as ParticleArgs }
export class Particle<A extends Args = Args> extends SpawnableEntity<A> {
  protected particleContainer: ParticleContainer | undefined
  private readonly emitter: particles.Emitter | undefined

  public constructor(ctx: SpawnableContext<A>) {
    super(ctx)

    const $game = game('client')
    if ($game) {
      this.particleContainer = new ParticleContainer()
      stage().addChild(this.particleContainer)

      this.transform.addZIndexListener(() => {
        if (this.particleContainer)
          this.particleContainer.zIndex = this.transform.zIndex
      })

      if (this.particleContainer) {
        const emitterConfigWithPos = {
          ...this.args.emitterConfig,
          pos: {
            x: this.transform.position.x,
            y: this.transform.position.y,
          },
        }

        this.emitter = new particles.Emitter(
          this.particleContainer,
          emitterConfigWithPos,
        )
      }
    }
  }

  public override bounds(): Bounds | undefined {
    const { width, height } = this.args
    return { width, height }
  }

  public override isPointInside(_point: Vector): boolean {
    return false
  }

  public override onArgsUpdate(
    _path: ArgsPath<Args>,
    _: PreviousArgs<Args>,
  ): void {}

  public override onResize(_bounds: Bounds): void {}

  public override teardown(): void {
    this.particleContainer?.destroy({ children: true })
  }

  public override onRenderFrame(time: RenderTime): void {
    if (!this.emitter?.emit) {
      game().destroy(this)
      return
    }

    if (this.particleContainer && this.emitter) {
      this.emitter.update(time.delta)

      this.particleContainer.position = camera().offset

      this.emitter.resetPositionTracking()
      this.emitter.updateSpawnPos(
        this.transform.position.x,
        this.transform.position.y,
      )
    }
  }
}
