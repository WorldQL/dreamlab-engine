import Matter from 'matter-js'
import onChange from 'on-change'
import type { Sprite } from 'pixi.js'
import { Container } from 'pixi.js'
import { z } from 'zod'
import type { RenderTime } from '~/entity'
import type { EventHandler } from '~/events'
import {
  camera,
  debug,
  events,
  game,
  isClient,
  physics,
  stage,
} from '~/labs/magic'
import type { Bounds } from '~/math/bounds'
import { toRadians } from '~/math/general'
import type { Vector } from '~/math/vector.js'
import { Vec, VectorSchema } from '~/math/vector.js'
import {
  updateBodyWidthHeight,
  updateSpriteWidthHeight,
} from '~/spawnable/args'
import type {
  PreviousArgs,
  SpawnableContext,
} from '~/spawnable/spawnableEntity'
import { SpawnableEntity } from '~/spawnable/spawnableEntity'
import { createSprite } from '~/textures/sprites'
import { drawBox } from '~/utils/draw'
import type { BoxGraphics } from '~/utils/draw'
import { isBackground } from './background'
import type { Background } from './background'

enum BackgroundActionType {
  Clear = 'clear',
  Keep = 'keep',
  Set = 'set',
}

const BackgroundActionSetSchema = z.object({
  action: z.enum([BackgroundActionType.Set]),
  textureURL: z.string(),
  fadeTime: z.number().min(0.01).optional(),
  scale: VectorSchema.optional(),
  parallax: VectorSchema.optional(),
})

const BackgroundActionClearSchema = z.object({
  action: z.enum([BackgroundActionType.Clear]),
})

const BackgroundActionKeepSchema = z.object({
  action: z.enum([BackgroundActionType.Keep]),
})

export type BackgroundAction = z.infer<typeof BackgroundActionSchema>
const BackgroundActionSchema = z.discriminatedUnion('action', [
  BackgroundActionSetSchema,
  BackgroundActionClearSchema,
  BackgroundActionKeepSchema,
])

type Args = typeof ArgsSchema
const ArgsSchema = z.object({
  width: z.number().positive().min(1).default(1_000),
  height: z.number().positive().min(1).default(1_000),

  onEnter: BackgroundActionSchema.default({
    action: BackgroundActionType.Clear,
  }),
  onLeave: BackgroundActionSchema.default({
    action: BackgroundActionType.Clear,
  }),
})

export { ArgsSchema as BackgroundTriggerArgs }
export class BackgroundTrigger extends SpawnableEntity<Args> {
  private readonly trigger: Matter.Body
  private readonly container: Container | undefined
  private readonly gfx: BoxGraphics | undefined
  private sprite: Sprite | undefined

  private inside = false

  async #getBackground(): Promise<Background> {
    const $game = game()
    const existing = $game.queryType(isBackground)
    if (existing) return existing

    const spawned = $game.spawn({
      entity: '@dreamlab/Background',
      args: {},
      transform: { position: [0, 0] },
    })

    if (!spawned) {
      throw new Error('failed to spawn background')
    }

    if (!isBackground(spawned)) {
      throw new Error('???')
    }

    return spawned
  }

  async #updateBackground(
    action: z.infer<typeof BackgroundActionSchema>,
  ): Promise<void> {
    const background = await this.#getBackground()

    // This allows us to update the args without networking them
    const args = onChange.target(background.args)

    switch (action.action) {
      case BackgroundActionType.Set: {
        if (action.fadeTime) {
          args.fadeTime = action.fadeTime
          if (isClient()) background.onArgsUpdate('fadeTime', background.args)
        }

        if (action.scale) {
          args.scale = action.scale
          if (isClient()) background.onArgsUpdate('scale', background.args)
        }

        if (action.parallax) {
          args.parallax = action.parallax
          if (isClient()) background.onArgsUpdate('parallax', background.args)
        }

        args.textureURL = action.textureURL
        if (isClient()) background.onArgsUpdate('textureURL', background.args)

        break
      }

      case BackgroundActionType.Clear: {
        args.textureURL = undefined
        if (isClient()) background.onArgsUpdate('textureURL', background.args)

        break
      }

      case BackgroundActionType.Keep: {
        // No-op
        break
      }
    }
  }

  readonly #onPlayerCollisionStart: EventHandler<'onPlayerCollisionStart'> =
    async ([_, other]) => {
      if (other !== this.trigger) return
      this.inside = true
      await this.#updateBackground(this.args.onEnter)
    }

  readonly #onPlayerCollisionEnd: EventHandler<'onPlayerCollisionEnd'> =
    async ([_, other]) => {
      if (other !== this.trigger) return
      this.inside = false
      await this.#updateBackground(this.args.onLeave)
    }

  public constructor(ctx: SpawnableContext<Args>) {
    super(ctx)

    this.trigger = Matter.Bodies.rectangle(
      this.transform.position.x,
      this.transform.position.y,
      this.args.width,
      this.args.height,
      {
        label: 'background_trigger',
        render: { visible: false },
        angle: toRadians(this.transform.rotation),

        isStatic: true,
        isSensor: true,
      },
    )

    physics().register(this, this.trigger)
    physics().linkTransform(this.trigger, this.transform)

    const $events = events('client')
    $events?.on('onPlayerCollisionStart', this.#onPlayerCollisionStart)
    $events?.on('onPlayerCollisionEnd', this.#onPlayerCollisionEnd)

    const $game = game('client')
    if ($game) {
      const { width, height } = this.args

      this.container = new Container()
      this.container.sortableChildren = true
      this.container.zIndex = this.transform.zIndex

      this.gfx = drawBox({ width, height }, { stroke: '#cc87ff' })
      this.gfx.zIndex = 100

      this.sprite =
        this.args.onEnter.action === 'set'
          ? createSprite(
              { url: this.args.onEnter.textureURL },
              { width, height },
            )
          : undefined

      this.container.addChild(this.gfx)
      if (this.sprite) this.container.addChild(this.sprite)
      stage().addChild(this.container)

      this.transform.addZIndexListener(() => {
        if (this.container) this.container.zIndex = this.transform.zIndex
      })
    }
  }

  public override teardown(): void {
    const $events = events('client')
    $events?.off('onPlayerCollisionStart', this.#onPlayerCollisionStart)
    $events?.off('onPlayerCollisionEnd', this.#onPlayerCollisionEnd)

    physics().unregister(this, this.trigger)
    physics().unlinkTransform(this.trigger, this.transform)

    this.container?.destroy({ children: true })
  }

  public override bounds(): Bounds | undefined {
    return { width: this.args.width, height: this.args.height }
  }

  public override isPointInside(point: Vector): boolean {
    return Matter.Query.point([this.trigger], point).length > 0
  }

  public override onArgsUpdate(
    path: string,
    previousArgs: PreviousArgs<Args>,
  ): void {
    updateBodyWidthHeight(path, this.trigger, this.args, previousArgs)
    updateSpriteWidthHeight(path, this?.sprite, this.args)

    if (this.gfx && (path === 'width' || path === 'height')) {
      this.gfx.redraw(this.args)
    }

    if (this.container && path.startsWith('onEnter')) {
      const { width, height } = this.args

      this.sprite?.destroy()
      this.sprite =
        this.args.onEnter.action === 'set'
          ? createSprite(
              { url: this.args.onEnter.textureURL },
              { width, height },
            )
          : undefined

      if (this.sprite) this.container.addChild(this.sprite)
    }
  }

  public override onResize(bounds: Bounds): void {
    this.args.width = bounds.width
    this.args.height = bounds.height
  }

  public override onRenderFrame(_: RenderTime): void {
    const pos = Vec.add(this.transform.position, camera().offset)

    if (this.container) {
      this.container.position = pos
      this.container.angle = this.transform.rotation
      this.container.alpha = debug() ? 0.5 : 0
    }

    if (this.sprite) this.sprite.alpha = this.inside ? 0 : 1
  }
}
