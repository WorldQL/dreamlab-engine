import { z } from 'zod'
import { camera, debug, isClient, stage } from '~/labs/magic'
import type { Bounds } from '~/math/bounds.js'
import { simpleBoundsTest } from '~/math/bounds.js'
import type { Vector } from '~/math/vector.js'
import { Vec } from '~/math/vector.js'
import type { SpawnableContext } from '~/spawnable/spawnableEntity'
import { SpawnableEntity } from '~/spawnable/spawnableEntity'
import type { BoxGraphics } from '~/utils/draw.js'
import { drawBox } from '~/utils/draw.js'

type Args = typeof ArgsSchema
export const ArgsSchema = z.object({
  width: z.number().positive().min(1).default(30),
  height: z.number().positive().min(1).default(30),
})

export class Marker extends SpawnableEntity<Args> {
  private readonly gfx: BoxGraphics | undefined

  public constructor(ctx: SpawnableContext<Args>) {
    super(ctx)

    if (isClient()) {
      this.gfx = drawBox(this.args, { stroke: '#00bcff' })
      this.gfx.zIndex = this.transform.zIndex

      stage().addChild(this.gfx)
      this.transform.addZIndexListener(() => {
        if (this.gfx) this.gfx.zIndex = this.transform.zIndex
      })
    }
  }

  public override teardown(): void {
    this.gfx?.destroy()
  }

  public override bounds(): Bounds | undefined {
    return { width: this.args.width, height: this.args.height }
  }

  public override isPointInside(point: Vector): boolean {
    return simpleBoundsTest(
      { width: this.args.width, height: this.args.height },
      this.transform,
      point,
    )
  }

  public override onArgsUpdate(path: string): void {
    if (this.gfx && (path === 'width' || path === 'height')) {
      this.gfx.redraw(this.args)
    }
  }

  public override onResize({ width, height }: Bounds): void {
    this.args.width = width
    this.args.height = height
  }

  public override onRenderFrame(): void {
    if (!this.gfx) return

    const pos = Vec.add(this.transform.position, camera().offset)

    this.gfx.position = pos
    this.gfx.angle = this.transform.rotation
    this.gfx.alpha = debug() ? 0.5 : 0
  }
}
