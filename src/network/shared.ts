import type { PascalCase } from 'type-fest'
import type { NetClient } from './client.js'
import type { NetServer } from './server.js'

export type Listeners<T extends {}> = {
  [K in keyof T as `${'add' | 'remove'}${PascalCase<K & string>}Listener`]: (
    ...args: T[K]
  ) => void
}

export type Data = Record<string, unknown>

export const onlyNetClient = (
  network: NetClient | NetServer | undefined,
): NetClient | undefined => {
  if (network?.type === 'client') return network
  return undefined
}

export const onlyNetServer = (
  network: NetClient | NetServer | undefined,
): NetServer | undefined => {
  if (network?.type === 'server') return network
  return undefined
}
