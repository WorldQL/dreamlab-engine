import cuid2 from '@paralleldrive/cuid2'
import type {
  SpawnableContext,
  SpawnableDefinition,
} from '~/spawnable/definition.js'
import type {
  SpawnableEntity,
  SpawnableFunction,
} from '~/spawnable/spawnableEntity.js'

// #region Registration
type BareSpawnableFunction<Args extends unknown[]> = SpawnableFunction<
  Args,
  SpawnableEntity,
  unknown,
  unknown
>

const spawnableFunctions = new Map<string, BareSpawnableFunction<unknown[]>>()

export const registerSpawnableFn = <Args extends unknown[]>(
  name: string,
  fn: BareSpawnableFunction<Args>,
) => {
  if (spawnableFunctions.has(name)) {
    throw new Error(`duplicate spawnable function: ${name}`)
  }

  spawnableFunctions.set(name, fn as BareSpawnableFunction<unknown[]>)
}

export const lookupSpawnableFn = (
  name: string,
): BareSpawnableFunction<unknown[]> | undefined => {
  return spawnableFunctions.get(name)
}
// #endregion

export const instantiate = (
  definition: SpawnableDefinition,
  preview = false,
): SpawnableEntity | undefined => {
  const fn = lookupSpawnableFn(definition.entityFn)
  if (fn === undefined) return undefined

  const context: SpawnableContext = {
    uid: definition.uid ?? cuid2.createId(),
    position: definition.position,
    tags: definition.tags ?? [],
    zIndex: definition.zIndex ?? 0,

    preview,
    definition,
  }

  return fn(context, ...definition.args)
}
