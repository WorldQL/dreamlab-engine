import type { Vector } from 'matter-js'
import { Assets, Spritesheet } from 'pixi.js'
import type { Resource, Texture } from 'pixi.js'
import type { Except } from 'type-fest'

export type Bone = (typeof bones)[number]
export const bones = ['handLeft', 'handRight'] as const

export type PlayerAnimationBones = Record<Bone, Vector[]>
export type PlayerAnimationTex = Texture<Resource>[]

export interface PlayerAnimation {
  width: number
  height: number

  bones: PlayerAnimationBones
  textures: PlayerAnimationTex
}

export type PlayerAnimationMap<
  T extends string,
  Fallible extends boolean = false,
> = Record<
  T,
  Fallible extends true ? PlayerAnimation | undefined : PlayerAnimation
>

type SpritesheetData = Except<PlayerAnimation, 'bones'>
export const loadPlayerSpritesheet = async (
  url: string,
  sort = true,
): Promise<SpritesheetData> => {
  const sheet = await Assets.load(url)
  if (!(sheet instanceof Spritesheet)) {
    throw new TypeError('is not a sprite sheet')
  }

  const textures = Object.values(sheet.textures)
  const width = textures.reduce((acc, tex) => Math.max(acc, tex.width), 0)
  const height = textures.reduce((acc, tex) => Math.max(acc, tex.height), 0)

  if (!sort) return { textures, width, height }
  const entries = Object.entries(sheet.textures)

  entries.sort(([a], [b]) => a.localeCompare(b))
  const mappedTex = entries.map(([, texture]) => texture)

  return { textures: mappedTex, width, height }
}

export type BoneMap<T extends string> =
  | PlayerAnimationBones
  | ((animation: T) => PlayerAnimationBones | Promise<PlayerAnimationBones>)

export type Fallback<T extends string> =
  | SpritesheetData
  | ((animation: T) => Promise<SpritesheetData> | SpritesheetData)

export const loadPlayerAnimations = async <
  const T extends readonly string[],
  F extends Record<T[number], Fallback<T[number]>> | undefined,
>(
  animations: T,
  urlFn: (animation: T[number]) => string,
  bones: Record<T[number], BoneMap<T[number]>>,
  fallback: F,
): Promise<
  PlayerAnimationMap<T[number], F extends undefined ? true : false>
> => {
  const jobs = animations.map(
    async (
      animation: T[number],
    ): Promise<readonly [T[number], PlayerAnimation | undefined]> => {
      const url = urlFn(animation)

      const boneFn = bones[animation]
      if (!boneFn) throw new Error(`missing bones for: ${animation}`)
      const boneData: PlayerAnimationBones =
        typeof boneFn === 'function' ? await boneFn(animation) : boneFn

      try {
        const spritesheet = await loadPlayerSpritesheet(url)
        return [animation, { ...spritesheet, bones: boneData }] as const
      } catch (error) {
        if (error instanceof Error) console.error(error)
        console.warn(`Failed to load spritesheet for "${url}"`)

        if (fallback === undefined) return [animation, undefined]

        const fn: Fallback<T[number]> = fallback[animation]
        const textures = typeof fn === 'function' ? await fn(animation) : fn

        return [animation, { ...textures, bones: boneData }] as const
      }
    },
  )

  const entries = await Promise.all(jobs)
  return Object.fromEntries(entries) as PlayerAnimationMap<
    T[number],
    F extends undefined ? true : false
  >
}
