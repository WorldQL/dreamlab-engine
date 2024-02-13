import { Assets, Spritesheet } from 'pixi.js'
import type { Resource, Texture } from 'pixi.js'
import type { Except } from 'type-fest'
import { z } from 'zod'
import { knownAnimation } from '~/entities/player'
import type { KnownAnimation } from '~/entities/player'
import { VectorSchema } from '~/math/vector.js'
import { resolve } from '~/sdk/resolve.js'
import { enumMap, typedFromEntries as fromEntries } from '~/utils/types.js'

export type Bone = (typeof bones)[number]
export const handBones = ['handLeft', 'handRight'] as const
export const bones = [...handBones] as const

const BoneOffsetSchema = z
  .tuple([z.number(), z.number(), z.number()])
  .transform(([x, y, delta]) => ({ x, y, delta }))

const BoneOffsetDataSchema = z
  // eslint-disable-next-line id-length
  .object({ x: BoneOffsetSchema, y: BoneOffsetSchema, z: BoneOffsetSchema })
  .array()

export const PlayerAnimationBonesSchema = z.object({
  bones: enumMap(z.enum(bones), VectorSchema.array()),
  handOffsets: enumMap(z.enum(handBones), BoneOffsetDataSchema),
})

export type PlayerAnimationBones = z.infer<typeof PlayerAnimationBonesSchema>
export type PlayerAnimationTex = Texture<Resource>[]

export interface PlayerAnimation {
  width: number
  height: number

  boneData: PlayerAnimationBones
  textures: PlayerAnimationTex
}

export type PlayerAnimationMap<
  T extends string,
  Fallible extends boolean = false,
> = Record<
  T,
  Fallible extends true ? PlayerAnimation | undefined : PlayerAnimation
>

const loadSpritesheet = async (
  url: string,
  id: string | undefined,
): Promise<Spritesheet> => {
  const sheet = await Assets.load({
    src: url,
    data: { cachePrefix: id ? id + '.' : undefined },
  })

  if (!(sheet instanceof Spritesheet)) {
    throw new TypeError('is not a sprite sheet')
  }

  return sheet
}

export const preloadPlayerSpritesheet = async (
  url: string,
  { id = url.split('/').at(-1) }: { id?: string | undefined } = {},
): Promise<void> => {
  const resolved = resolve(url)
  if (Assets.cache.has(resolved)) return

  await loadSpritesheet(resolved, id)
}

type SpritesheetData = Except<PlayerAnimation, 'boneData'>
export const loadPlayerSpritesheet = async (
  url: string,
  {
    id = url.split('/').at(-1),
    sort = true,
  }: { id?: string; sort?: boolean } = {},
): Promise<SpritesheetData> => {
  const getSheet = async (): Promise<Spritesheet> => {
    const resolved = resolve(url)
    const cached = Assets.cache.has(resolved) ? Assets.get(resolved) : undefined

    if (cached && cached instanceof Spritesheet) {
      return cached
    }

    return loadSpritesheet(resolved, id)
  }

  const sheet = await getSheet()

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
  id: string,
): Promise<
  PlayerAnimationMap<T[number], F extends undefined ? true : false>
> => {
  const jobs = animations.map(
    async (
      animation: T[number],
    ): Promise<readonly [T[number], PlayerAnimation | undefined]> => {
      const url = urlFn(animation)

      const boneFn = bones[animation]
      if (!boneFn) throw new Error(`missing bone data for: ${animation}`)
      const boneData: PlayerAnimationBones =
        typeof boneFn === 'function' ? await boneFn(animation) : boneFn

      try {
        const spritesheet = await loadPlayerSpritesheet(url, {
          id: `${animation}-${id}`,
        })

        return [animation, { ...spritesheet, boneData }] as const
      } catch (error) {
        if (error instanceof Error) console.error(error)
        console.warn(`Failed to load spritesheet for "${url}"`)

        if (fallback === undefined) return [animation, undefined]

        const fn: Fallback<T[number]> = fallback[animation]
        const textures = typeof fn === 'function' ? await fn(animation) : fn

        return [animation, { ...textures, boneData }] as const
      }
    },
  )

  const entries = await Promise.all(jobs)
  return Object.fromEntries(entries) as PlayerAnimationMap<
    T[number],
    F extends undefined ? true : false
  >
}

export const loadCharacterAnimations = async (
  characterId: string | undefined,
): Promise<PlayerAnimationMap<KnownAnimation>> => {
  const animations = knownAnimation

  const animationURL = (animation: string, fallback = false): string => {
    const stockURL = `https://s3-assets.dreamlab.gg/characters/default/${animation}.json`
    if (fallback === true) return stockURL
    if (characterId === undefined) return stockURL
    if (characterId === 'default') return stockURL

    return `https://s3-assets.dreamlab.gg/characters/${characterId}/${animation}.json`
  }

  const fallback: Fallback<KnownAnimation> = async animation => {
    const url = animationURL(animation, true)
    return loadPlayerSpritesheet(url, { id: `${animation}-fallback` })
  }

  const loadBones: BoneMap<KnownAnimation> = async animation => {
    const url = () => {
      const stockURL = `https://s3-assets.dreamlab.gg/characters/default/${animation}.meta.json`
      if (characterId === undefined) return stockURL
      if (characterId === 'default') return stockURL

      return `https://s3-assets.dreamlab.gg/characters/${characterId}/${animation}.meta.json`
    }

    const resp = await fetch(url())
    const json = await resp.json()

    return PlayerAnimationBonesSchema.parse(json)
  }

  const bones = fromEntries(animations.map(anim => [anim, loadBones] as const))
  const fallbackMap = fromEntries(
    animations.map(anim => [anim, fallback] as const),
  )

  return loadPlayerAnimations(
    animations,
    animationURL,
    bones,
    fallbackMap,
    characterId ?? 'default',
  )
}
