import type { Except } from 'type-fest'
import type { Data } from './shared.js'

export type MessageListener = (
  peer: string,
  channel: string,
  data: Data,
) => void

export interface NetServer {
  type: 'server'

  send(peer: string, channel: string, data: Data): void
  broadcast(channel: string, data: Data): void

  addMessageListener(channel: string, listener: MessageListener): void
  removeMessageListener(channel: string, listener: MessageListener): void
}

export const createNetServer = (
  handler: Except<NetServer, 'type'>,
): NetServer => {
  const net: NetServer = {
    type: 'server',
    ...handler,
  }

  return Object.freeze(net)
}
