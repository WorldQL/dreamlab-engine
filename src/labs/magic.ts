import { getGlobalGame } from '~/_internal/global-state'
import type { Game } from '~/game'
import type { NetClient } from '~/network/client'
import type { NetServer } from '~/network/server'

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

export const debug = () => game().debug.value
export const physics = () => game().physics
export const events = () => game().events

const magicClient =
  <T>(name: string, fn: (game: Game<false>) => T) =>
  () => {
    const _game = game('client')
    if (!_game) {
      throw new Error(`tried to access \`${name}()\` on the server`)
    }

    return fn(_game)
  }

export const stage = magicClient('stage', game => game.client.render.stage)
export const camera = magicClient('camera', game => game.client.render.camera)
export const inputs = magicClient('inputs', game => game.client.inputs)

export function network(type: 'client'): NetClient | undefined
export function network(type: 'server'): NetServer | undefined
export function network(
  type: 'client' | 'server',
): NetClient | NetServer | undefined {
  const _game = game()

  if (type === 'client') return _game.client?.network
  if (type === 'server') return _game.server?.network

  throw new Error('invalid parameter: type')
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
