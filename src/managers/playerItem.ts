import type { Texture } from 'pixi.js'
import { z } from 'zod'
import { isKnownAnimation } from '~/entities/player.js'
import type { KnownAnimation } from '~/entities/player.js'
import { createSprite } from '~/textures/sprites.js'

export type Item = z.infer<typeof ItemSchema>
export const ItemSchema = z.object({
  displayName: z.string(),
  texture: z.any() as z.ZodType<Texture>,
  textureURL: z.string().url(),
  animationName: z.string(),
  anchorX: z.number(),
  anchorY: z.number(),
  rotation: z.number(),
  bone: z.enum(['handLeft', 'handRight']),
  speedMultiplier: z.number().optional(),
})

export type PlayerItem = z.infer<typeof PlayerItemSchema>
export const PlayerItemSchema = ItemSchema.optional()

export const createItem = (
  displayName: string,
  textureURL: string,
  animationName: string,
  speedMultiplier: number | undefined,
  anchorX = 0.5,
  anchorY = 0.5,
  rotation = 0,
  bone: 'handLeft' | 'handRight' = 'handRight',
): PlayerItem => {
  const texture = createSprite(textureURL).texture

  const finalAnimationName: KnownAnimation = isKnownAnimation(animationName)
    ? animationName
    : 'greatsword'

  const newItem: PlayerItem = {
    displayName,
    texture,
    textureURL,
    animationName: finalAnimationName,
    anchorX,
    anchorY,
    rotation,
    bone,
    speedMultiplier,
  }

  return newItem
}
