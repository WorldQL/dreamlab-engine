import type { Except } from 'type-fest'
import type { Data, Listeners } from './shared.js'

export type MessageListenerClient = (channel: string, data: Data) => void

interface NetClientListeners {
  customMessage: [channel: string, listener: MessageListenerClient]
}

export type BareNetClient = Except<NetClient, 'type'>
export interface NetClient extends Listeners<NetClientListeners> {
  type: 'client'

  sendCustomMessage(channel: string, data: Data): Promise<void> | void
}
