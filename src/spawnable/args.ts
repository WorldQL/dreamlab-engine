import Matter from 'matter-js'
import type { Sprite } from 'pixi.js'

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
