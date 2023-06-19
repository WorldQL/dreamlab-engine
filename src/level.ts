import type { Except } from 'type-fest'
import type { z } from 'zod'
import { SpawnableDefinitionSchemaInternal } from '~/spawnable/definition.js'
import type { SpawnableDefinition } from '~/spawnable/definition.js'

export type LevelEntry<
  Name extends string = string,
  Args extends unknown[] = unknown[],
> = Except<SpawnableDefinition<Name, Args>, 'uid'>

const LevelEntrySchema = SpawnableDefinitionSchemaInternal.omit({
  uid: true,
}) as z.ZodType<LevelEntry>

export type Level = z.infer<typeof LevelSchema>
export const LevelSchema = LevelEntrySchema.array()
