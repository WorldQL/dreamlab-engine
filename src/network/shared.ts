import type { NetClient } from './client.js'
import type { NetServer } from './server.js'

export type Data = Record<string, unknown>

export const onlyNetClient = (
  network: NetClient | NetServer,
): NetClient | undefined => {
  if (network.type === 'client') return network
  return undefined
}

export const onlyNetServer = (
  network: NetClient | NetServer,
): NetServer | undefined => {
  if (network.type === 'server') return network
  return undefined
}
