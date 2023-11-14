import type { Texture } from 'pixi.js'
import type { KnownAnimation } from '~/entities/player.js'
import { createSprite } from '~/textures/sprites.js'

export interface Item {
  displayName: string
  texture: Texture
  textureURL: string
  animationName: string
  anchorX: number
  anchorY: number
  rotation: number
  bone: 'handLeft' | 'handRight'
  speedMultiplier: number | undefined
}

export type PlayerItem = Item | undefined

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

  const validAnimations: KnownAnimation[] = [
    'idle',
    'jump',
    'walk',
    'bow',
    'greatsword',
    'shoot',
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
    anchorX,
    anchorY,
    rotation,
    bone,
    speedMultiplier,
  }

  return newItem
}
