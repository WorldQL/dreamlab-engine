import { isEntity } from '~/entity'
import { BasePlayer } from './base-player'

const symbol = Symbol.for('@dreamlab/core/entities/player')
export const isPlayer = (player: unknown): player is Player => {
  if (!isEntity(player)) return false
  return symbol in player && player[symbol] === true
}

export enum PlayerInput {
  Attack = '@player/attack',
  Crouch = '@player/crouch',
  Jog = '@player/jog',
  Jump = '@player/jump',
  ToggleNoclip = '@player/toggle-noclip',
  WalkLeft = '@player/walk-left',
  WalkRight = '@player/walk-right',
}

export class Player extends BasePlayer {
  public readonly [symbol] = true as const

  // TODO: Implement Player
}
