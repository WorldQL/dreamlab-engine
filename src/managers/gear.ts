import { Texture } from 'pixi.js'
import type { Except } from 'type-fest'
import { z } from 'zod'
import { isKnownAnimation } from '~/entities/player'
import type { KnownAnimation } from '~/entities/player'
import { VectorSchema } from '~/math/vector.js'
import { resolve } from '~/sdk/resolve.js'
import { handBones } from '~/textures/playerAnimations.js'

export type BaseGear = z.infer<typeof BaseGearSchema>
export const BaseGearSchema = z.object({
  displayName: z.string(),
  textureURL: z.string(),
  animationName: z.string(),
  anchor: VectorSchema,
  rotation: z.number(),
  bone: z.enum(handBones),
  speedMultiplier: z.number().optional(),
})

export interface Gear extends Except<BaseGear, 'animationName'> {
  texture: Texture
  animationName: KnownAnimation
}

export const createGear = (base: BaseGear): Gear => {
  const texture = Texture.from(resolve(base.textureURL))
  const animationName = isKnownAnimation(base.animationName)
    ? base.animationName
    : 'greatsword'

  return {
    ...base,
    texture,
    animationName,
  }
}
