import Matter from 'matter-js'
import type { Body, Engine, World } from 'matter-js'
import { isPlayer } from '~/entities/player.js'
import type { Player } from '~/entities/player.js'
import { toDegrees, toRadians } from '~/math/general.js'
import { trackedSymbol } from '~/math/transform.js'
import type { TrackedTransform } from '~/math/transform.js'
import { isSpawnableEntity } from '~/spawnable/spawnableEntity.js'
import type {
  PartializeSpawnable,
  SpawnableEntity,
} from '~/spawnable/spawnableEntity.js'
import { ref } from '~/utils/ref.js'

export interface Physics {
  get running(): boolean

  /**
   * Suspend all physics bodies on entities.
   *
   * If no entities are passed, will suspend the entire physics system.
   */
  suspend(...entities: SpawnableEntity[]): void

  /**
   * Opposite of {@link Physics.suspend | suspend()}
   */
  resume(...entities: SpawnableEntity[]): void
  isFrozen(entity: SpawnableEntity): boolean

  get engine(): Engine
  get world(): World

  /**
   * Get all physics bodies for a given entity
   *
   * @param entity - Spawnable Entity
   */
  getBodies(entity: SpawnableEntity): Body[]

  /**
   * Get the entity that a physics body is registered to
   *
   * @param body - Physics Body
   */
  getEntity(body: Body): SpawnableEntity | undefined

  /**
   * Register a spawnable entity and its physics bodies with the physics system
   *
   * @param entity - Spawnable Entitiy
   * @param bodies - Physics Bodies
   */
  register<E extends SpawnableEntity<Data, Render>, Data, Render>(
    entity: E | PartializeSpawnable<E, Data, Render>,
    ...bodies: Body[]
  ): void

  /**
   * Removes a spawnable entity and its physics bodies from the physics system
   *
   * @param entity - Spawnable Entity
   * @param bodies - Physics Bodies
   */
  unregister<E extends SpawnableEntity<Data, Render>, Data, Render>(
    entity: E | PartializeSpawnable<E, Data, Render>,
    ...bodies: Body[]
  ): void

  /**
   * Link a transform object to a physics body
   *
   * Changes to the transform will be applied to the physics body,
   * and updates to the physics body will propagate back to the transform object
   *
   * @param body - Physics Body
   * @param transform - Entity Transform
   */
  linkTransform(body: Body, transform: TrackedTransform): void

  /**
   * Undo linking by {@link Physics.linkTransform | linkTransform()}
   *
   * @param body - Physics Body
   * @param transform - Entity Transform
   */
  unlinkTransform(body: Body, transform: TrackedTransform): void

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
  const frozenSet = new Set<string>()
  const playerRef = ref<Player | undefined>(undefined)

  interface LinkData {
    positionListener(this: void, ...args: unknown[]): void
    rotationListener(this: void, ...args: unknown[]): void
    onTick(this: void, ...args: unknown[]): void
  }

  const linksMap = new Map<number, LinkData>()

  const physics: Physics = {
    get running() {
      return running
    },

    suspend(...entities) {
      if (entities.length === 0) {
        running = false
        return
      }

      const bodies = entities.flatMap(entity => this.getBodies(entity))
      Matter.Composite.remove(engine.world, bodies)
      for (const entity of entities) frozenSet.add(entity.uid)
    },

    resume(...entities) {
      if (entities.length === 0) {
        running = true
        return
      }

      const bodies = entities.flatMap(entity => this.getBodies(entity))
      Matter.Composite.add(engine.world, bodies)
      for (const entity of entities) frozenSet.delete(entity.uid)
    },

    isFrozen(entity) {
      return frozenSet.has(entity.uid)
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

    linkTransform(body, transform) {
      const positionListener = () => {
        Matter.Body.setPosition(body, transform.position)
      }

      const rotationListener = () => {
        Matter.Body.setAngle(body, toRadians(transform.rotation))
      }

      const onTick = () => {
        transform[trackedSymbol].position.x = body.position.x
        transform[trackedSymbol].position.y = body.position.y
        transform[trackedSymbol].transform.rotation = toDegrees(body.angle)
      }

      transform.addPositionListener(positionListener)
      transform.addRotationListener(rotationListener)
      Matter.Events.on(engine, 'afterUpdate', onTick)

      linksMap.set(body.id, { positionListener, rotationListener, onTick })
    },

    unlinkTransform(body, transform) {
      const linked = linksMap.get(body.id)
      if (linked) {
        linksMap.delete(body.id)

        transform.removeListener(linked.positionListener)
        transform.removeListener(linked.rotationListener)
        Matter.Events.off(engine, 'afterUpdate', linked.onTick)
      }
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
