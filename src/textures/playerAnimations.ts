import { Assets, Spritesheet } from 'pixi.js'
import type { Resource, Texture } from 'pixi.js'

export type PlayerAnimationTex = Texture<Resource>[]
export interface PlayerAnimation {
  textures: PlayerAnimationTex
}

export type PlayerAnimationMap<
  T extends string,
  Fallible extends boolean = false,
> = Record<
  T,
  Fallible extends true ? PlayerAnimation | undefined : PlayerAnimation
>

export const loadPlayerSpritesheet = async (
  url: string,
  sort = true,
): Promise<PlayerAnimationTex> => {
  const sheet = await Assets.load(url)
  if (!(sheet instanceof Spritesheet)) {
    throw new TypeError('is not a sprite sheet')
  }

  if (!sort) return Object.values(sheet.textures)
  const entries = Object.entries(sheet.textures)

  entries.sort(([a], [b]) => a.localeCompare(b))
  return entries.map(([, texture]) => texture)
}

export type Fallback<T extends string> =
  | PlayerAnimationTex
  | ((animation: T) => PlayerAnimationTex | Promise<PlayerAnimationTex>)

export const loadPlayerAnimations = async <
  const T extends readonly string[],
  F extends Record<T[number], Fallback<T[number]>> | undefined,
>(
  animations: T,
  urlFn: (animation: T[number]) => string,
  fallback: F,
): Promise<
  PlayerAnimationMap<T[number], F extends undefined ? true : false>
> => {
  const jobs = animations.map(async (animation: T[number]) => {
    const url = urlFn(animation)

    try {
      const textures = await loadPlayerSpritesheet(url)
      return [animation, textures] as const
    } catch (error) {
      if (error instanceof Error) console.error(error)
      console.warn(`Failed to load spritesheet for "${url}"`)

      if (fallback === undefined) return [animation, undefined]

      const fn: Fallback<T[number]> = fallback[animation]
      const textures = typeof fn === 'function' ? await fn(animation) : fn

      return [animation, textures] as const
    }
  })

  const entries = await Promise.all(jobs)
  return Object.fromEntries(entries)
}
