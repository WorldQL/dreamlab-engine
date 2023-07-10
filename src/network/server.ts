import type { Except } from 'type-fest'
import type { Data, Listeners } from './shared.js'

export type MessageListenerServer = (
  peer: string,
  channel: string,
  data: Data,
) => void

interface NetServerListeners {
  customMessage: [channel: string, listener: MessageListenerServer]
}

export interface NetServer extends Listeners<NetServerListeners> {
  type: 'server'

  sendCustomMessage(peer: string, channel: string, data: Data): void
  broadcastCustomMessage(channel: string, data: Data): void
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
