import type { PascalCase } from 'type-fest'
import type { Game } from '~/game.js'
import type { NetClient } from './client.js'
import type { NetServer } from './server.js'

export type Listeners<T extends {}> = {
  [K in keyof T as `${'add' | 'remove'}${PascalCase<K & string>}Listener`]: (
    ...args: unknown[]
  ) => void
}

export type Data = Record<string, unknown>

export const onlyNetClient = (game: Game<boolean>): NetClient | undefined => {
  const network = game.server?.network ?? game.client?.network
  if (network?.type === 'client') return network

  return undefined
}

export const onlyNetServer = (game: Game<boolean>): NetServer | undefined => {
  const network = game.server?.network ?? game.client?.network
  if (network?.type === 'server') return network

  return undefined
}
