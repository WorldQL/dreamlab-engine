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
