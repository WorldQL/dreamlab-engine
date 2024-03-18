import Matter from 'matter-js'
import type { Body, Engine, World } from 'matter-js'
import { isPlayer } from '~/entities/player'
import type { Player } from '~/entities/player'
import { toDegrees, toRadians } from '~/math/general.js'
import { trackedSymbol } from '~/math/transform.js'
import type { TrackedTransform } from '~/math/transform.js'
import { isSpawnableEntity } from '~/spawnable/spawnableEntity.js'
import type { SpawnableEntity } from '~/spawnable/spawnableEntity.js'
import { ref } from '~/utils/ref.js'

export interface Physics {
  /**
   * Suspend all physics bodies on entities.
   */
  suspend(source: string, entities: SpawnableEntity[]): void

  /**
   * Opposite of {@link Physics.suspend | suspend()}
   */
  resume(source: string, entities: SpawnableEntity[]): void

  /**
   * Check if an entity is frozen.
   *
   * Leave `by` blank to check if the entity has been frozen by anything,
   * otherwise checks for a specific freezing source.
   *
   * @param entity - Spawnable Entity
   * @param source - Freeze Source
   */
  isFrozen(entity: SpawnableEntity, source?: string): boolean

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
  register<E extends SpawnableEntity>(
    entity: E,
    ...bodies: [body: Body, ...bodies: Body[]]
  ): void

  /**
   * Removes a spawnable entity and its physics bodies from the physics system
   *
   * @param entity - Spawnable Entity
   * @param bodies - Physics Bodies
   */
  unregister<E extends SpawnableEntity>(
    entity: E,
    ...bodies: [body: Body, ...bodies: Body[]]
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
  linkTransform(
    body: Body,
    transform: TrackedTransform,
    options?: { updateVelocity?: boolean; updateAngularVelocity?: boolean },
  ): void

  /**
   * Undo linking by {@link Physics.linkTransform | linkTransform()}
   *
   * @param body - Physics Body
   * @param transform - Entity Transform
   */
  unlinkTransform(body: Body, transform: TrackedTransform): void

  /**
   * Check if a physics body is linked to a Transform
   *
   * @param body - Physics Body
   * @param transform - Entity Transform
   */
  isLinked(body: Body, transform: TrackedTransform): boolean

  registerPlayer(player: Player): void
  clearPlayer(): void
  isPlayer(body: Body): boolean
  getPlayer(body: Body): Player | undefined
}

const randomID = (): number => {
  return Math.floor(Number.MAX_SAFE_INTEGER * Math.random())
}

export const createPhysics = (): Physics => {
  const engine = Matter.Engine.create()
  const entities = new Map<string, Body[]>()
  const bodiesMap = new Map<number, SpawnableEntity>()
  const linksMap = new Map<number, LinkData>()
  const frozenMap = new Map<string, Set<Body>>()
  const playerRef = ref<Player | undefined>(undefined)

  interface LinkData {
    transform: TrackedTransform
    positionListener(this: void, ...args: unknown[]): void
    rotationListener(this: void, ...args: unknown[]): void
    onTick(this: void, ...args: unknown[]): void
  }

  const frozenBodies = (): Set<Body> => {
    const allBodiesIter = [...frozenMap.values()].flatMap(set => set.values())
    return new Set<Body>(...allBodiesIter)
  }

  const physics: Physics = {
    suspend(source, entities) {
      if (entities.length === 0) return
      const bodies = entities.flatMap(entity => this.getBodies(entity))
      if (bodies.length === 0) return

      const beforeFrozen = frozenBodies()
      const set = frozenMap.get(source) ?? new Set()
      for (const body of bodies) {
        if (!beforeFrozen.has(body) && body.isStatic) continue
        set.add(body)
      }

      frozenMap.set(source, set)

      const afterFrozen = frozenBodies()
      const difference = new Set(
        [...afterFrozen].filter(x => !beforeFrozen.has(x)),
      )

      for (const body of difference) {
        Matter.Body.setStatic(body, true)
      }
    },

    resume(source, entities) {
      if (entities.length === 0) return
      const bodies = entities.flatMap(entity => this.getBodies(entity))
      if (bodies.length === 0) return

      const beforeResumed = frozenBodies()
      const set = frozenMap.get(source) ?? new Set()
      for (const body of bodies) set.delete(body)

      if (set.size === 0) frozenMap.delete(source)
      else frozenMap.set(source, set)

      const afterResumed = frozenBodies()
      const difference = new Set(
        [...beforeResumed].filter(x => !afterResumed.has(x)),
      )

      for (const body of difference) {
        Matter.Body.setStatic(body, false)
      }
    },

    isFrozen(entity, source) {
      const bodies = this.getBodies(entity)
      if (bodies.length === 0) return false

      if (source === undefined) {
        for (const set of frozenMap.values()) {
          for (const body of bodies) {
            if (set.has(body)) return true
          }
        }

        return false
      }

      const set = frozenMap.get(source)
      if (!set) return false

      for (const body of bodies) {
        if (set.has(body)) return true
      }

      return false
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

    linkTransform(body, transform, options) {
      const positionListener = () => {
        Matter.Body.setPosition(
          body,
          transform.position,
          // @ts-expect-error incorrect typings
          options?.updateVelocity ?? false,
        )
      }

      const rotationListener = () => {
        Matter.Body.setAngle(
          body,
          toRadians(transform.rotation),
          // @ts-expect-error incorrect typings
          options?.updateAngularVelocity ?? false,
        )
      }

      const onTick = () => {
        transform[trackedSymbol].position.x = body.position.x
        transform[trackedSymbol].position.y = body.position.y
        transform[trackedSymbol].transform.rotation = toDegrees(body.angle)
      }

      transform.addPositionListener(positionListener)
      transform.addRotationListener(rotationListener)
      Matter.Events.on(engine, 'afterUpdate', onTick)

      linksMap.set(body.id, {
        transform,
        positionListener,
        rotationListener,
        onTick,
      })
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

    isLinked(body, transform) {
      const linked = linksMap.get(body.id)
      if (!linked) return false

      return linked.transform === transform
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
