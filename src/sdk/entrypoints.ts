import type { Game } from '~/game.js'
import { SpawnableDefinitionSchema } from '~/spawnable/definition.js'
import type { LooseSpawnableDefinition } from '~/spawnable/definition.js'

type InitFn<Server extends boolean> = (
  game: Game<Server>,
) => Promise<void> | void

export type InitClient = InitFn<false>
export type InitServer = InitFn<true>
export type InitShared = InitFn<boolean>

export type Level = LooseSpawnableDefinition[]
export const LevelSchema = SpawnableDefinitionSchema.array()
