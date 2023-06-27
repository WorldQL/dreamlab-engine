import type { Except } from 'type-fest'
import type { Data } from './shared.js'

export type MessageListenerClient = (channel: string, data: Data) => void
export interface NetClient {
  type: 'client'

  sendCustomMessage(channel: string, data: Data): void

  addCustomMessageListener(
    channel: string,
    listener: MessageListenerClient,
  ): void

  removeCustomMessageListener(
    channel: string,
    listener: MessageListenerClient,
  ): void
}

export const createNetClient = (
  handler: Except<NetClient, 'type'>,
): NetClient => {
  const net: NetClient = {
    type: 'client',
    ...handler,
  }

  return Object.freeze(net)
}
