import type { Texture } from 'pixi.js'
import type { KnownAnimation } from '~/entities/player.js'
import { createSprite } from '~/textures/sprites.js'

export interface ItemOptions {
  anchorX?: number | undefined
  anchorY?: number | undefined
  hand?: 'left' | 'right'
  speedMultiplier?: number
}

export interface Item {
  displayName: string
  texture: Texture
  textureURL: string
  animationName: string
  itemOptions?: ItemOptions
}

export type PlayerItem = Item | undefined

export const createItem = (
  displayName: string,
  textureURL: string,
  animationName: string,
  itemOptions?: ItemOptions,
): PlayerItem => {
  const texture = createSprite(textureURL).texture

  const validAnimations: KnownAnimation[] = [
    'idle',
    'jump',
    'walk',
    'bow',
    'greatsword',
  ]
  const finalAnimationName = validAnimations.includes(
    animationName as KnownAnimation,
  )
    ? animationName
    : 'greatsword'

  const newItem: PlayerItem = {
    displayName,
    texture,
    textureURL,
    animationName: finalAnimationName,
  }

  if (itemOptions) {
    newItem.itemOptions = itemOptions
  }

  return newItem
}
