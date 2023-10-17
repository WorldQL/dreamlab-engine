import { Sprite, Texture, TilingSprite } from 'pixi.js'
import { z } from 'zod'

export type SpriteSourceOptions = z.infer<typeof SpriteSourceOptionsSchema>
export const SpriteSourceOptionsSchema = z.object({
  url: z.string(),
  tile: z.boolean().or(z.number()).optional(),
})

export type SpriteSource = z.infer<typeof SpriteSourceSchema>
export const SpriteSourceSchema = z.string().or(SpriteSourceOptionsSchema)

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
