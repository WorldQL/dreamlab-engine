import { Sprite, Texture } from 'pixi.js'

export interface SpriteOptions {
  width?: number
  height?: number

  zIndex?: number
}

export const createSprite = (
  url: string,
  { width, height, zIndex }: SpriteOptions = {},
): Sprite => {
  const texture = Texture.from(url)
  const sprite = new Sprite(texture)

  sprite.anchor.set(0.5)

  if (width) sprite.width = width
  if (height) sprite.height = height
  if (zIndex) sprite.zIndex = zIndex

  return sprite
}
