import Matter from 'matter-js'
import type { Body, Engine, World } from 'matter-js'
import { isPlayer } from '~/entities/player.js'
import type { Player } from '~/entities/player.js'
import { isSpawnableEntity } from '~/spawnable/spawnableEntity.js'
import type {
  PartializeSpawnable,
  SpawnableEntity,
} from '~/spawnable/spawnableEntity.js'
import { ref } from '~/utils/ref.js'

export interface Physics {
  get running(): boolean
  suspend(): void
  resume(): void

  get engine(): Engine
  get world(): World

  getBodies(entity: SpawnableEntity): Body[]
  getEntity(body: Body): SpawnableEntity | undefined

  register<E extends SpawnableEntity<Data, Render>, Data, Render>(
    entity: E | PartializeSpawnable<E, Data, Render>,
    ...bodies: Body[]
  ): void
  unregister<E extends SpawnableEntity<Data, Render>, Data, Render>(
    entity: E | PartializeSpawnable<E, Data, Render>,
    ...bodies: Body[]
  ): void

  registerPlayer(player: Player): void
  clearPlayer(): void
  isPlayer(body: Body): boolean
  getPlayer(body: Body): Player | undefined
}

const randomID = (): number => {
  return Math.floor(Number.MAX_SAFE_INTEGER * Math.random())
}

export const createPhysics = (): Physics => {
  let running = true

  const engine = Matter.Engine.create()
  const entities = new Map<string, Body[]>()
  const bodiesMap = new Map<number, SpawnableEntity>()
  const playerRef = ref<Player | undefined>(undefined)

  const physics: Physics = {
    get running() {
      return running
    },

    suspend() {
      running = false
    },

    resume() {
      running = true
    },

    get engine() {
      return engine
    },

    get world() {
      return engine.world
    },

    getBodies(entity) {
      if (!isSpawnableEntity(entity)) {
        throw new TypeError('entity is not a spawnableentity')
      }

      return entities.get(entity.uid) ?? []
    },

    getEntity(body) {
      return bodiesMap.get(body.id)
    },

    register(entity, ...bodies) {
      if (!isSpawnableEntity(entity)) {
        throw new TypeError('entity is not a spawnableentity')
      }

      // Override Matter.js sequential IDs with random ones
      for (const body of bodies) {
        body.id = randomID()
      }

      const set = entities.get(entity.uid) ?? []
      set.push(...bodies)

      entities.set(entity.uid, set)
      for (const body of bodies) {
        bodiesMap.set(body.id, entity)
      }

      Matter.Composite.add(engine.world, bodies)
    },

    unregister(entity, ...bodies) {
      if (!isSpawnableEntity(entity)) {
        throw new TypeError('entity is not a spawnableentity')
      }

      const set = entities.get(entity.uid) ?? []
      for (const body of bodies) {
        const idx = set.indexOf(body)
        if (idx !== -1) set.splice(idx)
      }

      entities.set(entity.uid, set)
      if (set.length === 0) entities.delete(entity.uid)

      for (const body of bodies) {
        bodiesMap.delete(body.id)
      }

      Matter.Composite.remove(engine.world, bodies)
    },

    registerPlayer(player) {
      if (!isPlayer(player)) {
        throw new TypeError('not a player')
      }

      player.body.id = randomID()
      playerRef.value = player

      Matter.Composite.add(engine.world, player.body)
    },

    clearPlayer() {
      if (playerRef.value) {
        Matter.Composite.remove(engine.world, playerRef.value.body)
      }

      playerRef.value = undefined
    },

    isPlayer(body) {
      if (!playerRef.value) return false
      return body.id === playerRef.value.body.id
    },

    getPlayer(body) {
      if (!playerRef.value) return undefined
      if (body.id !== playerRef.value.body.id) return undefined

      return playerRef.value
    },
  }

  return physics
}
