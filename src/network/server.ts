import type { Except } from 'type-fest'
import type { Data, Listeners } from './shared.js'

export interface PeerInfo {
  readonly connectionId: string
  readonly playerId: string
}

export type MessageListenerServer = (
  peer: PeerInfo,
  channel: string,
  data: Data,
) => void

interface NetServerListeners {
  customMessage: [channel: string, listener: MessageListenerServer]
}

export type BareNetServer = Except<NetServer, 'type'>
export interface NetServer extends Listeners<NetServerListeners> {
  type: 'server'

  sendCustomMessage(
    connectionId: string,
    channel: string,
    data: Data,
  ): Promise<void> | void
  broadcastCustomMessage(channel: string, data: Data): Promise<void> | void
  broadcastSyncedValue(
    entityId: string,
    key: string,
    value: unknown,
  ): Promise<void> | void
}
