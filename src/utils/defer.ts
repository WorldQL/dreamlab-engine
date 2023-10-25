import type { RenderTime, Time } from '~/entity.js'
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
