import { getGlobalGame } from '~/_internal/global-state'
import type { Game } from '~/game'

// #region Magic Functions
export function game(): Game<boolean>
export function game(type: 'client'): Game<false> | undefined
export function game(type: 'server'): Game<true> | undefined
export function game(type?: 'client' | 'server'): Game<boolean> | undefined {
  const game = getGlobalGame()
  if (game === undefined || game === 'pending') {
    throw new Error('failed to get game')
  }

  if (type === undefined) return game
  if (type === 'client') return game.client ? game : undefined
  if (type === 'server') return game.server ? game : undefined

  throw new Error('invalid parameter: type')
}

export const isServer = (): boolean => {
  const _game = game()
  return _game.server !== undefined
}

export const isClient = (): boolean => {
  const _game = game()
  return _game.client !== undefined
}
// #endregion

// #region Type-Safe Class Members
const onlyClient = Symbol.for('onlyClient')
type ClientOnly<T> = T | typeof onlyClient

function clientOnly<T>(factory: () => T): ClientOnly<T> {
  if (!isClient()) return onlyClient
  return factory()
}

export { clientOnly as unstable_clientOnly }
// #endregion
