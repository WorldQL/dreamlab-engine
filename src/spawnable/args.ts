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

export const updateSpriteSource = <K extends string>(
  source: SpriteSource | undefined,
  key: K,
  render: { [k in K]: Sprite | undefined },
  container: Container,
  options?: SpriteOptions,
) => {
  if (!render) return
  render[key]?.destroy()

  const sprite = source ? createSprite(source, options) : undefined
  render[key] = sprite

  if (sprite) container.addChild(sprite)
}
