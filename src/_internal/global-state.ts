import type { Game } from '~/game'

const symbol = Symbol.for('@dreamlab/core/global-state')

export const setGlobalGame = (value: Game<boolean> | 'pending' | undefined) => {
  // @ts-expect-error Global
  globalThis[symbol] = value
}

export const getGlobalGame = (): Game<boolean> | 'pending' | undefined => {
  // @ts-expect-error Global
  const value: unknown = globalThis[symbol]

  if (typeof value === 'undefined') return undefined
  if (value === 'pending') return 'pending'

  // TODO: Validate is game
  return value as Game<boolean>
}
