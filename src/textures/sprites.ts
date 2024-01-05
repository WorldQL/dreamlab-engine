import { Sprite, Texture, TilingSprite } from 'pixi.js'
import { z } from 'zod'

export type SpriteSource = z.infer<typeof SpriteSourceSchema>
export const SpriteSourceSchema = z.object({
  url: z.string(),
  tile: z.boolean().default(false),
  tileScale: z.number().optional(),
})

export interface SpriteOptions {
  width?: number
  height?: number
  zIndex?: number
}

export const createSprite = (
  source: SpriteSource,
  { width, height, zIndex }: SpriteOptions = {},
): Sprite => {
  const { url, tile, tileScale }: SpriteSource = source

  const texture = Texture.from(url)
  const createSprite = () => {
    if (!tile) return new Sprite(texture)

    const sprite = new TilingSprite(texture)
    if (typeof tileScale === 'number') sprite.tileScale.set(tileScale)

    return sprite
  }

  const sprite = createSprite()
  sprite.anchor.set(0.5)

  if (width) sprite.width = width
  if (height) sprite.height = height
  if (zIndex) sprite.zIndex = zIndex

  return sprite
}
