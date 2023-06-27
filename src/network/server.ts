import type { Except } from 'type-fest'
import type { Data } from './shared.js'

export type MessageListenerServer = (
  peer: string,
  channel: string,
  data: Data,
) => void

export interface NetServer {
  type: 'server'

  sendCustomMessage(peer: string, channel: string, data: Data): void
  broadcastCustomMessage(channel: string, data: Data): void

  addCustomMessageListener(
    channel: string,
    listener: MessageListenerServer,
  ): void

  removeCustomMessageListener(
    channel: string,
    listener: MessageListenerServer,
  ): void
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
