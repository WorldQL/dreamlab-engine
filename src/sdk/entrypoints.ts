import type { Game } from '~/game.js'

type InitFn<Headless extends boolean> = (
  game: Game<Headless>,
) => Promise<void> | void

export type InitClient = InitFn<false>
export type InitServer = InitFn<false>
export type InitShared = InitFn<boolean>
