import { Assets, Spritesheet } from 'pixi.js'
import type { Resource, Texture } from 'pixi.js'

export type Animation = Texture<Resource>[]
export type AnimationMap<
  T extends readonly string[],
  Fallible extends boolean = false,
> = Record<T[number], Fallible extends true ? Animation | undefined : Animation>

export const loadSpritesheet = async (
  url: string,
  sort = true,
): Promise<Animation> => {
  const sheet = await Assets.load(url)
  if (!(sheet instanceof Spritesheet)) {
    throw new TypeError('is not a sprite sheet')
  }

  if (!sort) return Object.values(sheet.textures)
  const entries = Object.entries(sheet.textures)

  entries.sort(([a], [b]) => a.localeCompare(b))
  return entries.map(([, texture]) => texture)
}

export const loadAnimations = async <
  const T extends readonly string[],
  F extends AnimationMap<T> | undefined,
>(
  animations: T,
  urlFn: (animation: T[number]) => string,
  fallback: F,
): Promise<AnimationMap<T, F extends undefined ? true : false>> => {
  const jobs = animations.map(async (animation: T[number]) => {
    const url = urlFn(animation)

    try {
      const textures = await loadSpritesheet(url)
      return [animation, textures] as const
    } catch (error) {
      if (error instanceof Error) console.error(error)
      console.warn(`Failed to load spritesheet for "${url}"`)

      const textures: Animation | undefined = fallback?.[animation]
      return [animation, textures]
    }
  })

  const entries = await Promise.all(jobs)
  return Object.fromEntries(entries)
}
