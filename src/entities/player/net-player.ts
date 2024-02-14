import { createId } from '@paralleldrive/cuid2'
import Matter from 'matter-js'
import { isEntity } from '~/entity'
import type { Bounds } from '~/math/bounds'
import type { LooseVector } from '~/math/vector'
import { v } from '~/math/vector'
import { BasePlayer } from './base-player'

const symbol = Symbol.for('@dreamlab/core/entities/net-player')
export const isNetPlayer = (netplayer: unknown): netplayer is NetPlayer => {
  if (!isEntity(netplayer)) return false
  return symbol in netplayer && netplayer[symbol] === true
}

export class NetPlayer extends BasePlayer {
  public readonly [symbol] = true as const

  public readonly entityId: string

  public constructor(
    public readonly connectionId: string,
    entityId: string | undefined,
    characterId: string | undefined,
    public readonly nickname: string | undefined,
    bounds?: Partial<Bounds>,
  ) {
    super(characterId, bounds)
    this.entityId = entityId ?? createId()
  }

  public setPosition(vector: LooseVector): void {
    Matter.Body.setPosition(this.body, v(vector))
  }

  public setVelocity(vector: LooseVector): void {
    Matter.Body.setVelocity(this.body, v(vector))
  }

  // TODO: Implement NetPlayer
}
