import type { Payload } from './shared.js'

export type MessageListener = (payload: Payload) => void
export interface NetClient {
  type: 'client'

  send(payload: Payload): void

  addMessageListener(listener: MessageListener): void
  removeMessageListener(listener: MessageListener): void
}

export const createNetClient = (ws: WebSocket): NetClient => {
  const listeners = new Set<MessageListener>()
  const onMessage = ({ data }: MessageEvent) => {
    // TODO: Decode correctly

    for (const fn of listeners) {
      fn(data)
    }
  }

  ws.addEventListener('message', onMessage)
  const net: NetClient = {
    type: 'client',

    send: payload => {
      // TODO: Encode correctly
      ws.send(JSON.stringify(payload))
    },

    addMessageListener: fn => listeners.add(fn),
    removeMessageListener: fn => listeners.delete(fn),
  }

  return Object.freeze(net)
}
