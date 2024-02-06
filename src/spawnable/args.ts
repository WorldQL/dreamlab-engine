import Matter from 'matter-js'
import type { Container, Sprite } from 'pixi.js'
import { createSprite } from '~/textures/sprites.js'
import type { SpriteOptions, SpriteSource } from '~/textures/sprites.js'

export const updateBodyWidthHeight = (
  body: Matter.Body,
  args: { width: number; height: number },
  previous: { width: number; height: number },
) => {
  const { width: originalWidth, height: originalHeight } = previous
  const { width, height } = args

  const angle = body.angle
  const scaleX = width / originalWidth
  const scaleY = height / originalHeight

  Matter.Body.setAngle(body, 0)
  Matter.Body.scale(body, scaleX, scaleY)
  Matter.Body.setAngle(body, angle)
}

export const updateSpriteWidthHeight = (
  sprite: Sprite | undefined,
  args: { width: number; height: number },
) => {
  if (!sprite) return

  sprite.width = args.width
  sprite.height = args.height
}

export const updateSpriteSource = <
  SpriteKey extends string,
  SourceKey extends string,
  ContainerKey extends string,
>(
  path: string,
  spriteKey: SpriteKey,
  sourceKey: SourceKey,
  containerKey: ContainerKey,
  args: SpriteOptions & { [k in SourceKey]?: SpriteSource | undefined },
  render:
    | ({
        [k in ContainerKey]: Container
      } & { [k in SpriteKey]: Sprite | undefined })
    | undefined,
) => {
  if (!render) return
  if (path !== sourceKey && !path.startsWith(sourceKey + '.')) return

  const sprite = spriteKey
  const source = args[sourceKey]
  const container = render[containerKey]

  render[sprite]?.destroy()
  const newSprite = source ? createSprite(source, args) : undefined

  // @ts-expect-error generic narrowing
  render[sprite] = newSprite
  if (newSprite) container.addChild(newSprite)
}
