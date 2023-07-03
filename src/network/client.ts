import type { Vector } from 'matter-js'
import type { Except } from 'type-fest'
import type { Data } from './shared.js'

export type MessageListenerClient = (channel: string, data: Data) => void
export interface NetClient {
  type: 'client'

  // #region Custom Messages
  sendCustomMessage(channel: string, data: Data): void

  addCustomMessageListener(
    channel: string,
    listener: MessageListenerClient,
  ): void

  removeCustomMessageListener(
    channel: string,
    listener: MessageListenerClient,
  ): void
  // #endregion

  // #region Player
  sendPlayerPosition(position: Vector, velocity: Vector, flipped: boolean): void
  // #endregion
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
