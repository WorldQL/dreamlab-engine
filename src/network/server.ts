import type { Except } from 'type-fest'
import type { Data, Listeners } from './shared.js'

export type MessageListenerServer<T extends {} = Data> = (
  peer: string,
  channel: string,
  data: T,
) => void

interface NetServerListeners {
  customMessage: [channel: string, listener: MessageListenerServer]
}

export type BareNetServer = Except<NetServer, 'type'>
export interface NetServer extends Listeners<NetServerListeners> {
  type: 'server'

  sendCustomMessage(peer: string, channel: string, data: Data): void
  broadcastCustomMessage(channel: string, data: Data): void
}
