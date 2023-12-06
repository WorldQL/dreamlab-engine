import { Container, Texture, TilingSprite } from 'pixi.js'
import { z } from 'zod'
import type { Camera } from '~/entities/camera.js'
import { Vec, VectorSchema } from '~/math/vector.js'
import { createSpawnableEntity } from '~/spawnable/spawnableEntity.js'
import type {
  PartializeSpawnable,
  SpawnableEntity,
} from '~/spawnable/spawnableEntity.js'
import type { Debug } from '~/utils/debug.js'

const BLANK_PNG =
  'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAIAAAACCAYAAABytg0kAAAAAXNSR0IArs4c6QAAAARnQU1BAACxjwv8YQUAAAAJcEhZcwAADsMAAA7DAcdvqGQAAAAUSURBVBhXY/wPBAxAwAQiGBgYGAA9+AQAag6xEAAAAABJRU5ErkJggg=='

type Args = typeof ArgsSchema
const ArgsSchema = z.object({
  textureURL: z.string().optional(),
  opacity: z.number().min(0).max(1).default(1),
  fadeTime: z.number().min(0.01).default(0.2),
  scale: VectorSchema.default({ x: 1, y: 1 }),
  parallax: VectorSchema.default({ x: -0.2, y: -0.2 }),
})

interface Data {
  debug: Debug
}

interface Render {
  camera: Camera

  container: Container
  spriteFront: TilingSprite
  spriteBack: TilingSprite
}

const symbol = Symbol.for('@dreamlab/core/background')
export interface Background extends SpawnableEntity<Data, Render, Args> {
  [symbol]: true
}

export const isBackground = (entity: SpawnableEntity): entity is Background => {
  return symbol in entity && entity[symbol] === true
}

const textureAndSize = async (
  textureURL: string | undefined,
): Promise<[texture: Texture, width: number, height: number]> => {
  const texture = await Texture.fromURL(textureURL ?? BLANK_PNG)

  const scale = 100
  const width = textureURL ? texture.width * scale : 16_000
  const height = textureURL ? texture.height * scale : 9_000

  return [texture, width, height]
}

export const createBackground = createSpawnableEntity<
  Args,
  Background,
  Data,
  Render
>(ArgsSchema, ({ tags }, args) => {
  let fadeTarget = 0
  const origin = Vec.create(0, 0)

  const background: PartializeSpawnable<Background, Data, Render> = {
    get [symbol]() {
      return true as const
    },

    get tags() {
      return [...tags]
    },

    rectangleBounds() {
      return undefined
    },

    isPointInside(_position) {
      return false
    },

    init({ game }) {
      return { debug: game.debug }
    },

    async initRenderContext(_, { stage, camera }) {
      const [texture, texWidth, texHeight] = await textureAndSize(
        args.textureURL,
      )

      const container = new Container()
      const spriteFront = new TilingSprite(texture)
      const spriteBack = new TilingSprite(texture)

      spriteFront.tileScale.set(args.scale.x, args.scale.y)
      spriteBack.tileScale.set(args.scale.x, args.scale.y)

      spriteFront.width = texWidth
      spriteFront.height = texHeight
      spriteBack.width = spriteFront.width
      spriteBack.height = spriteFront.height

      spriteFront.anchor.set(0.5, 0.5)
      spriteBack.anchor.set(0.5, 0.5)

      container.sortableChildren = true
      container.zIndex = -1_000
      spriteFront.zIndex = -999
      spriteBack.zIndex = -1_000

      container.addChild(spriteFront)
      container.addChild(spriteBack)
      stage.addChild(container)

      return { camera, container, spriteFront, spriteBack }
    },

    async onArgsUpdate(path, _previous, _data, render) {
      if (render && path === 'textureURL') {
        const [texture, texWidth, texHeight] = await textureAndSize(
          args.textureURL,
        )

        /* eslint-disable require-atomic-updates */
        render.spriteBack.texture = texture
        render.spriteBack.width = texWidth
        render.spriteBack.height = texHeight
        /* eslint-enable require-atomic-updates */

        fadeTarget = args.fadeTime
      }

      if (render && path.startsWith('scale.')) {
        render.spriteFront.tileScale.set(args.scale.x, args.scale.y)
        render.spriteBack.tileScale.set(args.scale.x, args.scale.y)
      }
    },

    teardown(_) {
      // No-op
    },

    teardownRenderContext({ container }) {
      container.destroy({ children: true })
    },

    onRenderFrame(
      { delta },
      _data,
      { camera, container, spriteFront, spriteBack },
    ) {
      if (fadeTarget > 0) {
        fadeTarget -= delta
        spriteFront.alpha = fadeTarget / args.fadeTime

        if (fadeTarget <= 0) {
          fadeTarget = 0
          spriteFront.texture = spriteBack.texture
          spriteFront.width = spriteBack.width
          spriteFront.height = spriteBack.height
          spriteFront.alpha = 1
        }
      }

      const distance = Vec.create(
        camera.position.x * args.parallax.x,
        camera.position.y * args.parallax.y,
      )

      const inverseDistance = Vec.create(
        camera.position.x * (1 - args.parallax.x),
        camera.position.y * (1 - args.parallax.y),
      )

      const { width, height } = spriteBack.texture
      if (inverseDistance.x > origin.x + width) origin.x += width
      else if (inverseDistance.x < origin.x - width) origin.x -= width

      if (inverseDistance.y > origin.y + height) origin.y += height
      else if (inverseDistance.y < origin.y - height) origin.y -= height

      const position = Vec.add(origin, distance)
      const pos = Vec.add(position, camera.offset)

      container.position = pos
      container.alpha = args.opacity
    },
  }

  return background
})
