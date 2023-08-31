import type { CamelCase, Except } from 'type-fest'
import type { Data, Listeners } from './shared.js'
import type { PlayerInput } from '~/entities/player.js'
import type { Vector } from '~/math/vector.js'

type Inputs = `${PlayerInput}` extends `@player/${infer T}` ? T : never
type InputMap = Record<CamelCase<Inputs>, boolean>

export type MessageListenerClient = (channel: string, data: Data) => void

interface NetClientListeners {
  customMessage: [channel: string, listener: MessageListenerClient]
}

export type BareNetClient = Except<NetClient, 'type'>
export interface NetClient extends Listeners<NetClientListeners> {
  type: 'client'

  sendCustomMessage(channel: string, data: Data): void
  sendPlayerPosition(position: Vector, velocity: Vector, flipped: boolean): void

  // sendPlayerMotionInputs(
  //   jump: boolean,
  //   fallThrough: boolean,
  //   left: boolean,
  //   right: boolean,
  //   attack: boolean,
  // ): void

  sendPlayerMotionInputs(inputs: InputMap): void

  sendPlayerAnimation(animation: string): void
}
