import Matter from 'matter-js'
import type { Container, Sprite } from 'pixi.js'
import { createSprite } from '~/textures/sprites.js'
import type { SpriteSource } from '~/textures/sprites.js'

export const updateBodyWidthHeight = (
  path: string,
  body: Matter.Body,
  args: { width: number; height: number },
  previous: { width: number; height: number },
) => {
  if (path !== 'width' && path !== 'height') return

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
  path: string,
  sprite: Sprite | undefined,
  args: { width: number; height: number },
) => {
  if (path !== 'width' && path !== 'height') return
  if (!sprite) return

  sprite.width = args.width
  sprite.height = args.height
}

export const updateSpriteSource = (
  path: string,
  sourceKey: string,
  container: Container | undefined,
  sprite: Sprite | undefined,
  spriteSource: SpriteSource | undefined,
  args: { width: number; height: number },
) => {
  console.log(path, sourceKey)
  if (path !== sourceKey && !path.startsWith(sourceKey + '.')) return sprite
  if (!container || !spriteSource) return sprite

  sprite?.destroy()
  const newSprite = spriteSource ? createSprite(spriteSource, args) : undefined
  if (newSprite) container.addChild(newSprite)

  return newSprite
}
