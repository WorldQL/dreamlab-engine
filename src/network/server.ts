import type { Except } from 'type-fest'
import type { Transform } from '~/math/transform.js'
import type { LooseSpawnableDefinition } from '~/spawnable/definition.js'
import type { Data, Listeners } from './shared.js'

export interface PeerInfo {
  readonly peerID: string
  readonly playerID: string
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
    peerID: string,
    channel: string,
    data: Data,
  ): Promise<void> | void
  broadcastCustomMessage(channel: string, data: Data): Promise<void> | void
  broadcastSyncedValue(
    entityID: string,
    key: string,
    value: unknown,
  ): Promise<void> | void

  sendEntityCreate(
    peerID: string,
    definition: LooseSpawnableDefinition,
  ): Promise<void> | void
  sendEntityDestroy(peerID: string, entityID: string): Promise<void> | void
  sendTransformUpdate(
    peerID: string,
    entityID: string,
    transform: Transform,
  ): Promise<void> | void
  sendArgsUpdate(
    peerID: string,
    entityID: string,
    path: string,
    value: unknown,
  ): Promise<void> | void
}
