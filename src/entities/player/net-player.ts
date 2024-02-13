import { isEntity } from '~/entity'
import { BasePlayer } from './base-player'

const symbol = Symbol.for('@dreamlab/core/entities/net-player')
export const isNetPlayer = (netplayer: unknown): netplayer is NetPlayer => {
  if (!isEntity(netplayer)) return false
  return symbol in netplayer && netplayer[symbol] === true
}

export class NetPlayer extends BasePlayer {
  public readonly [symbol] = true as const

  // TODO: Implement NetPlayer
}
