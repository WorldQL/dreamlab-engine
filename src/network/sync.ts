import equal from 'fast-deep-equal/es6/index.js'
import { dataManager } from '~/entity.js'
import type { Game } from '~/game.js'
import { isSpawnableEntity } from '~/spawnable/spawnableEntity.js'

export const symbol = Symbol.for('@dreamlab/core/syncedValue')
export const setter = Symbol.for('@dreamlab/core/syncedValue/setter')

export interface SyncedValue<T> {
  readonly [symbol]: true
  readonly entityID: string
  readonly key: string

  get value(): T
  set value(v: T)

  sync(): void
  [setter](value: T): void
}

export const syncedValue = <T, Server extends boolean>(
  game: Game<Server>,
  entityID: string,
  key: string,
  initialValue: T,
): SyncedValue<T> => {
  let prev: T = initialValue
  let value: T = initialValue

  const synced: SyncedValue<T> = {
    [symbol]: true,

    get entityID() {
      return entityID
    },

    get key() {
      return key
    },

    get value() {
      return value
    },

    set value(val) {
      const server = game.server
      if (!server) {
        throw new Error('cannot assign to synced values on the client')
      }

      prev = value
      const changed = !equal(prev, val)
      value = val

      if (changed) server.network?.broadcastSyncedValue(entityID, key, value)
    },

    sync() {
      game.server?.network?.broadcastSyncedValue(entityID, key, value)
    },

    [setter](val) {
      value = val
    },
  }

  return synced
}

export const isSyncedValue = (
  value: unknown,
): value is SyncedValue<unknown> => {
  if (value === undefined || value === null) return false
  if (typeof value !== 'object') return false

  return symbol in value && value[symbol] === true
}

export const syncEntities = (game: Game<true>) => {
  // eslint-disable-next-line unicorn/no-array-callback-reference
  const spawnables = game.entities.filter(isSpawnableEntity)

  for (const entity of spawnables) {
    const data = dataManager.getData(entity)
    if (data === undefined || data === null) continue
    if (typeof data !== 'object') continue

    for (const value of Object.values(data)) {
      if (isSyncedValue(value)) value.sync()
    }
  }
}

export const updateSyncedValue = (
  game: Game<false>,
  entityID: string,
  key: string,
  value: unknown,
) => {
  // eslint-disable-next-line unicorn/no-array-callback-reference
  const spawnables = game.entities.filter(isSpawnableEntity)
  const entity = spawnables.find(({ uid }) => uid === entityID)
  if (!entity) return

  const data = dataManager.getData(entity)
  if (data === undefined || data === null) return
  if (typeof data !== 'object') return

  const syncedValue = Object.values(data)
    // eslint-disable-next-line unicorn/no-array-callback-reference
    .filter(isSyncedValue)
    .find(value => value.key === key)

  if (!syncedValue) return
  syncedValue[setter](value)
}
