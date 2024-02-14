import type { Gear } from '~/managers/gear'

const knownPlayerAnimation = ['idle', 'jog', 'jump', 'walk'] as const
const knownAttackAnimation = ['greatsword', 'punch'] as const
const knownRangedAttackAnimation = ['bow', 'shoot'] as const

export type KnownPlayerAnimation = (typeof knownPlayerAnimation)[number]
export type KnownAttackAnimation = (typeof knownAttackAnimation)[number]
export type KnownRangedAttackAnimation =
  (typeof knownRangedAttackAnimation)[number]

export type KnownAnimation = (typeof knownAnimation)[number]
export const knownAnimation = [
  ...knownPlayerAnimation,
  ...knownAttackAnimation,
  ...knownRangedAttackAnimation,
] as const

export const isKnownAnimation = (
  animation: string,
): animation is KnownAnimation => {
  // @ts-expect-error union narrowing
  return knownAnimation.includes(animation)
}

export const isAttackAnimation = (animation: KnownAnimation): boolean => {
  switch (animation) {
    case 'greatsword':
    case 'punch':
    case 'bow':
    case 'shoot':
      return true
    default:
      return false
  }
}

export const getSpeedMultiplier = (
  animation: string,
  gear: Gear | undefined,
) => {
  if (
    gear?.speedMultiplier &&
    ((knownAttackAnimation as readonly string[]).includes(animation) ||
      (knownRangedAttackAnimation as readonly string[]).includes(animation))
  ) {
    return gear.speedMultiplier
  }

  switch (animation) {
    case 'greatsword':
      return 2.2
    case 'punch':
      return 2.5
    default:
      return 1
  }
}
