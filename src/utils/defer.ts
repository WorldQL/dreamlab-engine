import { isPlayer } from '~/entities/player.js'
import type { Player } from '~/entities/player.js'
import type { RenderTime, Time } from '~/entity.js'
import type { EventHandler } from '~/events.js'
import type { Game } from '~/game.js'

export const waitForPhysicsStep = async (
  game: Game<boolean>,
): Promise<void> => {
  return new Promise<void>(resolve => {
    game.events.common.once('onPhysicsStep', () => resolve())
  })
}

export const deferUntilPhysicsStep = (
  game: Game<boolean>,
  fn: (time: Time) => void,
) => {
  game.events.common.once('onPhysicsStep', fn)
}

export const waitForRenderFrame = async (game: Game<false>): Promise<void> => {
  return new Promise<void>(resolve => {
    game.events.client.once('onRenderFrame', () => resolve())
  })
}

export const deferUntilRenderFrame = (
  game: Game<false>,
  fn: (time: RenderTime) => void,
) => {
  game.events.client.once('onRenderFrame', fn)
}

export const waitForPlayer = async (game: Game<boolean>): Promise<Player> => {
  const player = game.entities.find(isPlayer)
  if (player) return player

  return new Promise<Player>(resolve => {
    const onInstantiate: EventHandler<'onInstantiate'> = entity => {
      if (isPlayer(entity)) {
        game.events.common.removeListener('onInstantiate', onInstantiate)
        resolve(entity)
      }
    }

    game.events.common.addListener('onInstantiate', onInstantiate)
  })
}

export const deferUntilPlayer = (
  game: Game<boolean>,
  fn: (player: Player) => void,
) => {
  const player = game.entities.find(isPlayer)
  if (player) {
    fn(player)
    return
  }

  const onInstantiate: EventHandler<'onInstantiate'> = entity => {
    if (isPlayer(entity)) {
      game.events.common.removeListener('onInstantiate', onInstantiate)
      fn(entity)
    }
  }

  game.events.common.addListener('onInstantiate', onInstantiate)
}
