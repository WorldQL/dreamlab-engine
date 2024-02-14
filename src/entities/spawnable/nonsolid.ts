import type { Vector } from 'matter-js'
import type { Sprite } from 'pixi.js'
import { Container } from 'pixi.js'
import { z } from 'zod'
import type { RenderTime } from '~/entity'
import { camera, debug, game, stage } from '~/labs/magic'
import { simpleBoundsTest } from '~/math/bounds'
import type { Bounds } from '~/math/bounds'
import { Vec } from '~/math/vector'
import { updateSpriteWidthHeight } from '~/spawnable/args'
import type {
  ArgsPath,
  PreviousArgs,
  SpawnableContext,
} from '~/spawnable/spawnableEntity'
import { SpawnableEntity } from '~/spawnable/spawnableEntity'
import { createSprite, SpriteSourceSchema } from '~/textures/sprites'
import type { BoxGraphics } from '~/utils/draw'
import { drawBox } from '~/utils/draw'

type Args = typeof ArgsSchema
export const ArgsSchema = z.object({
  width: z.number().positive().min(1).default(100),
  height: z.number().positive().min(1).default(100),
  spriteSource: SpriteSourceSchema.optional(),
})

export class NonSolid<A extends Args = Args> extends SpawnableEntity<A> {
  protected readonly container: Container | undefined
  protected readonly gfx: BoxGraphics | undefined
  protected readonly sprite: Sprite | undefined

  public constructor(
    ctx: SpawnableContext<A>,
    { stroke = 'blue' }: { stroke?: string } = {},
  ) {
    super(ctx)

    const $game = game('client')
    if ($game) {
      const { width, height, spriteSource } = this.args

      this.container = new Container()
      this.container.sortableChildren = true
      this.container.zIndex = this.transform.zIndex

      this.gfx = drawBox({ width, height }, { stroke })
      this.gfx.zIndex = 100

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
    const { width, height } = this.args
    return { width, height }
  }

  public override isPointInside(point: Vector): boolean {
    const { width, height } = this.args
    return simpleBoundsTest({ width, height }, this.transform, point)
  }

  public override onArgsUpdate(
    path: ArgsPath<Args>,
    _previousArgs: PreviousArgs<Args>,
  ): void {
    updateSpriteWidthHeight(path, this?.sprite, this.args)

    if (this.gfx && (path === 'width' || path === 'height')) {
      this.gfx.redraw(this.args)
    }

    // updateSpriteSource(
    //   path,
    //   'sprite',
    //   'spriteSource',
    //   'container',
    //   this.args,
    //   this,
    // )
  }

  public override onResize(bounds: Bounds): void {
    this.args.width = bounds.width
    this.args.height = bounds.height
  }

  public override teardown(): void {
    this.container?.destroy({ children: true })
  }

  public override onRenderFrame(_time: RenderTime): void {
    const pos = Vec.add(this.transform.position, camera().offset)

    if (this.container) {
      this.container.position = pos
      this.container.angle = this.transform.rotation
    }

    if (this.gfx) this.gfx.alpha = debug() ? 0.5 : 0
  }
}
