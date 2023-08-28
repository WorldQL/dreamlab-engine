import type { Game } from '~/game.js'

type InitFn<Server extends boolean> = (
  game: Game<Server>,
) => Promise<void> | void

export type InitClient = InitFn<false>
export type InitServer = InitFn<false>
export type InitShared = InitFn<boolean>
