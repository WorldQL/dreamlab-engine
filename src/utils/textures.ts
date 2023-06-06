import { Sprite, Texture, TilingSprite } from 'pixi.js'

export interface SpriteSourceOptions {
  url: string
  tile?: boolean | number
}

export type SpriteSource = SpriteSourceOptions | string

export interface SpriteOptions {
  width?: number
  height?: number

  zIndex?: number
}

export const createSprite = (
  source: SpriteSource,
  { width, height, zIndex }: SpriteOptions = {},
): Sprite => {
  const { url, tile = false }: SpriteSourceOptions =
    typeof source === 'string' ? { url: source } : source

  const texture = Texture.from(url)
  const createSprite = () => {
    if (!tile) return new Sprite(texture)

    const sprite = new TilingSprite(texture)
    if (typeof tile === 'number') sprite.tileScale.set(tile)

    return sprite
  }

  const sprite = createSprite()
  sprite.anchor.set(0.5)

  if (width) sprite.width = width
  if (height) sprite.height = height
  if (zIndex) sprite.zIndex = zIndex

  return sprite
}
