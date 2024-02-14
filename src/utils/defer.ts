import type { Player } from '~/entities/player'
import { isPlayer } from '~/entities/player'
import type { RenderTime, Time } from '~/entity'
import type { EventHandler } from '~/events'
import { events, game } from '~/labs/magic'

export const waitForPhysicsStep = async (): Promise<void> => {
  return new Promise<void>(resolve => {
    events().common.once('onPhysicsStep', () => resolve())
  })
}

export const deferUntilPhysicsStep = (fn: (time: Time) => void) => {
  events().common.once('onPhysicsStep', fn)
}

export const waitForRenderFrame = async (): Promise<void> => {
  const $game = game('client', true)
  return new Promise<void>(resolve => {
    $game.events.client.once('onRenderFrame', () => resolve())
  })
}

export const deferUntilRenderFrame = (fn: (time: RenderTime) => void) => {
  const $game = game('client', true)
  $game.events.client.once('onRenderFrame', fn)
}

export const waitForPlayer = async (): Promise<Player> => {
  const $game = game()
  const player = $game.entities.find(isPlayer)
  if (player) return player

  return new Promise<Player>(resolve => {
    const onInstantiate: EventHandler<'onInstantiate'> = entity => {
      if (isPlayer(entity)) {
        $game.events.common.removeListener('onInstantiate', onInstantiate)
        resolve(entity)
      }
    }

    $game.events.common.addListener('onInstantiate', onInstantiate)
  })
}

export const deferUntilPlayer = (fn: (player: Player) => void) => {
  const $game = game('client', true)
  const player = $game.entities.find(isPlayer)
  if (player) {
    fn(player)
    return
  }

  const onInstantiate: EventHandler<'onInstantiate'> = entity => {
    if (isPlayer(entity)) {
      $game.events.common.removeListener('onInstantiate', onInstantiate)
      fn(entity)
    }
  }

  $game.events.common.addListener('onInstantiate', onInstantiate)
}
