import {
  Container,
  SCALE_MODES,
  Texture,
  TilingSprite,
  WRAP_MODES,
} from 'pixi.js'
import { z } from 'zod'
import type { RenderTime } from '~/entity'
import { camera, game, stage } from '~/labs/magic'
import type { Bounds } from '~/math/bounds'
import type { Vector } from '~/math/vector'
import { Vec, VectorSchema } from '~/math/vector'
import { resolve } from '~/sdk/resolve'
import type {
  PreviousArgs,
  SpawnableContext,
} from '~/spawnable/spawnableEntity'
import { isSpawnableEntity, SpawnableEntity } from '~/spawnable/spawnableEntity'

const symbol = Symbol.for('@dreamlab/core/entities/background')
export const isBackground = (background: unknown): background is Background => {
  if (!isSpawnableEntity(background)) return false
  return symbol in background && background[symbol] === true
}

type Args = typeof ArgsSchema
const ArgsSchema = z.object({
  textureURL: z.string().optional(),
  opacity: z.number().min(0).max(1).default(1),
  fadeTime: z.number().min(0.01).default(0.2),
  scale: VectorSchema.default({ x: 1, y: 1 }),
  parallax: VectorSchema.default({ x: -0.2, y: -0.2 }),
})

export { ArgsSchema as BackgroundArgs }
export class Background extends SpawnableEntity<Args> {
  public static readonly BLANK_PNG =
    'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAIAAAACCAYAAABytg0kAAAAAXNSR0IArs4c6QAAAARnQU1BAACxjwv8YQUAAAAJcEhZcwAADsMAAA7DAcdvqGQAAAAUSURBVBhXY/wPBAxAwAQiGBgYGAA9+AQAag6xEAAAAABJRU5ErkJggg=='

  static readonly #textureAndSize = (
    textureURL: string | undefined,
  ): [texture: Texture, width: number, height: number] => {
    const url = textureURL ? resolve(textureURL) : Background.BLANK_PNG
    const texture = Texture.from(url)

    const scale = 100
    const width = textureURL ? texture.width * scale : 16_000
    const height = textureURL ? texture.height * scale : 9_000

    return [texture, width, height]
  }

  public readonly [symbol] = true as const

  private readonly container: Container | undefined
  private readonly spriteFront: TilingSprite | undefined
  private readonly spriteBack: TilingSprite | undefined

  private fadeTarget = 0
  private readonly origin = Vec.create(0, 0)

  public constructor(ctx: SpawnableContext<Args>) {
    super(ctx)
    this.tags.push('editor/doNotSave')

    const $game = game('client')
    if ($game) {
      const [texture, texWidth, texHeight] = Background.#textureAndSize(
        this.args.textureURL,
      )

      this.container = new Container()
      this.container.sortableChildren = true
      this.container.zIndex = -1_000

      texture.baseTexture.wrapMode = WRAP_MODES.CLAMP
      this.spriteFront = new TilingSprite(texture, texWidth, texHeight)
      this.spriteBack = new TilingSprite(texture, texWidth, texHeight)

      this.spriteFront.zIndex = -999
      this.spriteBack.zIndex = -1_000
      this.spriteFront.clampMargin = 0
      this.spriteBack.clampMargin = 0
      this.spriteFront.texture.baseTexture.scaleMode = SCALE_MODES.NEAREST
      this.spriteBack.texture.baseTexture.scaleMode = SCALE_MODES.NEAREST
      this.spriteFront.tileScale.set(this.args.scale.x, this.args.scale.y)
      this.spriteBack.tileScale.set(this.args.scale.x, this.args.scale.y)
      this.spriteFront.anchor.set(0.5, 0.5)
      this.spriteBack.anchor.set(0.5, 0.5)

      this.container.addChild(this.spriteFront)
      this.container.addChild(this.spriteBack)
      stage().addChild(this.container)
    }
  }

  public override teardown(): void {
    this.container?.destroy({ children: true })
  }

  public override bounds(): Bounds | undefined {
    return undefined
  }

  public override isPointInside(_: Vector): boolean {
    return false
  }

  public override onArgsUpdate(path: string, _: PreviousArgs<Args>): void {
    if (this.spriteBack && path === 'textureURL') {
      const [texture, texWidth, texHeight] = Background.#textureAndSize(
        this.args.textureURL,
      )

      this.spriteBack.texture = texture
      this.spriteBack.width = texWidth
      this.spriteBack.height = texHeight

      this.fadeTarget = this.args.fadeTime
    }

    if (path === 'scale' || path.startsWith('scale.')) {
      if (this.spriteFront) {
        this.spriteFront.tileScale.set(this.args.scale.x, this.args.scale.y)
      }

      if (this.spriteBack) {
        this.spriteBack.tileScale.set(this.args.scale.x, this.args.scale.y)
      }
    }
  }

  public override onRenderFrame({ delta }: RenderTime): void {
    if (!this.spriteFront || !this.spriteBack) {
      console.warn('missing sprites')
      return
    }

    if (this.fadeTarget > 0) {
      this.fadeTarget -= delta
      this.spriteFront.alpha = this.fadeTarget / this.args.fadeTime

      if (this.fadeTarget <= 0) {
        this.fadeTarget = 0
        this.spriteFront.texture = this.spriteBack.texture
        this.spriteFront.width = this.spriteBack.width
        this.spriteFront.height = this.spriteBack.height
        this.spriteFront.alpha = 1
      }
    }

    const $camera = camera()

    const distance = Vec.create(
      $camera.position.x * this.args.parallax.x,
      $camera.position.y * this.args.parallax.y,
    )

    const inverseDistance = Vec.create(
      $camera.position.x * (1 - this.args.parallax.x),
      $camera.position.y * (1 - this.args.parallax.y),
    )

    const { width: _w, height: _h } = this.spriteBack.texture
    const width = _w * this.spriteBack.tileScale.x
    const height = _h * this.spriteBack.tileScale.y

    if (inverseDistance.x > this.origin.x + width) this.origin.x += width
    else if (inverseDistance.x < this.origin.x - width) this.origin.x -= width

    if (inverseDistance.y > this.origin.y + height) this.origin.y += height
    else if (inverseDistance.y < this.origin.y - height) this.origin.y -= height

    const position = Vec.add(this.origin, distance)
    const pos = Vec.add(position, $camera.offset)
    if (this.container) {
      this.container.position = pos
      this.container.alpha = this.args.opacity
    }
  }
}
