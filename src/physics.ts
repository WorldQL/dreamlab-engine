import Matter from 'matter-js'
import type { Body, Engine, World } from 'matter-js'
import { isSpawnableEntity } from '~/spawnable/spawnableEntity.js'
import type {
  PartializeSpawnable,
  SpawnableEntity,
} from '~/spawnable/spawnableEntity.js'
import { ref } from '~/utils/ref.js'

export interface Physics {
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

  registerPlayer(body: Body): void
  clearPlayer(): void
  isPlayer(body: Body): boolean
}

const randomID = (): number => {
  return Math.floor(Number.MAX_SAFE_INTEGER * Math.random())
}

export const createPhysics = (): Physics => {
  const engine = Matter.Engine.create()
  const entities = new Map<string, Body[]>()
  const bodiesMap = new Map<number, SpawnableEntity>()
  const playerBodyRef = ref<Body | undefined>(undefined)

  const physics: Physics = {
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

    registerPlayer(body) {
      body.id = randomID()
      playerBodyRef.value = body

      Matter.Composite.add(engine.world, body)
    },

    clearPlayer() {
      if (playerBodyRef.value) {
        Matter.Composite.remove(engine.world, playerBodyRef.value)
      }

      playerBodyRef.value = undefined
    },

    isPlayer(body) {
      if (!playerBodyRef.value) return false
      return body.id === playerBodyRef.value.id
    },
  }

  return physics
}
