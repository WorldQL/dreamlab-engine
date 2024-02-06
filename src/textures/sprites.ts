import { Sprite, Texture, TilingSprite } from 'pixi.js'
import { z } from 'zod'
import { resolve } from '~/sdk/resolve.js'

export type SpriteSource = z.infer<typeof SpriteSourceSchema>
export const SpriteSourceSchema = z.object({
  url: z.string(),
  tile: z.boolean().default(false).optional(),
  tileScale: z.number().optional(),
})

export interface SpriteOptions {
  width?: number
  height?: number
}

export const createSprite = (
  source: SpriteSource,
  { width, height }: SpriteOptions = {},
): Sprite => {
  const { url, tile, tileScale }: SpriteSource = source

  const texture = Texture.from(resolve(url))
  const createSprite = () => {
    if (!tile) return new Sprite(texture)

    const sprite = new TilingSprite(texture)
    if (typeof tileScale === 'number') {
      const scale = tileScale === 0 ? Number.MAX_SAFE_INTEGER : 1 / tileScale
      sprite.tileScale.set(scale)
    }

    return sprite
  }

  const sprite = createSprite()
  sprite.anchor.set(0.5)

  if (width) sprite.width = width
  if (height) sprite.height = height

  return sprite
}
