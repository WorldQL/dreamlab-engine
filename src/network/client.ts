import type { Vector } from 'matter-js'
import type { Except } from 'type-fest'
import type { Data, Listeners } from './shared.js'

export type MessageListenerClient = (channel: string, data: Data) => void

interface NetClientListeners {
  customMessage: [channel: string, listener: MessageListenerClient]
}

export interface NetClient extends Listeners<NetClientListeners> {
  type: 'client'

  sendCustomMessage(channel: string, data: Data): void
  sendPlayerPosition(position: Vector, velocity: Vector, flipped: boolean): void
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
