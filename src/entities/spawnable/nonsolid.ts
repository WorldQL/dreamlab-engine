import type { Vector } from 'matter-js'
import type { Sprite } from 'pixi.js'
import { Container } from 'pixi.js'
import { z } from 'zod'
import type { RenderTime } from '~/entity'
import { camera, debug, game, stage } from '~/labs/magic'
import { simpleBoundsTest } from '~/math/bounds'
import type { Bounds } from '~/math/bounds'
import { Vec } from '~/math/vector'
import { updateSpriteSource, updateSpriteWidthHeight } from '~/spawnable/args'
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

export class NonSolid extends SpawnableEntity<Args> {
  protected readonly container: Container | undefined
  protected readonly gfx: BoxGraphics | undefined
  protected readonly sprite: Sprite | undefined

  public constructor(
    ctx: SpawnableContext<Args>,
    { stroke = 'blue' }: { stroke?: string } = {},
  ) {
    super(ctx)

    const _game = game('client')
    if (_game) {
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
    _path: ArgsPath<Args>,
    _previousArgs: PreviousArgs<Args>,
  ): void {
    // TODO
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

// import { Container, Graphics } from 'pixi.js'
// import type { Sprite } from 'pixi.js'
// import type { Camera } from '~/entities/camera.js'
// import { simpleBoundsTest } from '~/math/bounds.js'
// import { Vec } from '~/math/vector.js'
// import {
//   updateSpriteSource,
//   updateSpriteWidthHeight,
// } from '~/spawnable/args.js'
// import { createSpawnableEntity } from '~/spawnable/spawnableEntity.js'
// import type { SpawnableEntity } from '~/spawnable/spawnableEntity.js'
// import { createSprite, SpriteSourceSchema } from '~/textures/sprites.js'
// import type { Debug } from '~/utils/debug.js'
// import { drawBox } from '~/utils/draw.js'
// import type { RedrawBox } from '~/utils/draw.js'

// interface Data {
//   debug: Debug
// }

// interface Render {
//   camera: Camera
//   container: Container
//   gfx: Graphics
//   redrawGfx: RedrawBox
//   sprite: Sprite | undefined
// }

// export const createNonsolid = createSpawnableEntity<
//   Args,
//   SpawnableEntity<Data, Render, Args>,
//   Data,
//   Render
// >(ArgsSchema, ({ transform }, args) => ({
//   rectangleBounds() {
//     return { width: args.width, height: args.height }
//   },

//   isPointInside(point) {
//     return simpleBoundsTest(
//       { width: args.width, height: args.height },
//       transform,
//       point,
//     )
//   },

//   init({ game }) {
//     return { debug: game.debug }
//   },

//   initRenderContext(_, { stage, camera }) {
//     const { width, height, spriteSource } = args

//     const container = new Container()
//     container.sortableChildren = true
//     container.zIndex = transform.zIndex

//     const gfx = new Graphics()
//     gfx.zIndex = 100
//     const redrawGfx = drawBox(gfx, { width, height }, { stroke: 'blue' })

//     const sprite = spriteSource
//       ? createSprite(spriteSource, { width, height })
//       : undefined

//     container.addChild(gfx)
//     if (sprite) container.addChild(sprite)
//     stage.addChild(container)

//     transform.addZIndexListener(() => {
//       container.zIndex = transform.zIndex
//     })

//     return { camera, container, gfx, redrawGfx, sprite }
//   },

//   onArgsUpdate(path, _previous, _data, render) {
//     updateSpriteWidthHeight(path, render?.sprite, args)

//     if (render && (path === 'width' || path === 'height')) {
//       render.redrawGfx(args)
//     }

//     updateSpriteSource(
//       path,
//       'sprite',
//       'spriteSource',
//       'container',
//       args,
//       render,
//     )
//   },

//   onResize({ width, height }) {
//     args.width = width
//     args.height = height
//   },

//   teardown(_) {
//     // No-op
//   },

//   teardownRenderContext({ gfx, sprite }) {
//     gfx.destroy()
//     sprite?.destroy()
//   },

//   onRenderFrame(_, { debug }, { camera, container, gfx }) {
//     const pos = Vec.add(transform.position, camera.offset)

//     container.position = pos
//     container.angle = transform.rotation
//     gfx.alpha = debug.value ? 0.5 : 0
//   },
// }))
