import type { Except } from 'type-fest'
import type { Data } from './shared.js'

export type MessageListener = (channel: string, data: Data) => void
export interface NetClient {
  type: 'client'

  send(channel: string, data: Data): void

  addMessageListener(channel: string, listener: MessageListener): void
  removeMessageListener(channel: string, listener: MessageListener): void
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
