import { createId } from '@paralleldrive/cuid2'
import Matter from 'matter-js'
import type { Body, Engine, Vector } from 'matter-js'
import { PLAYER_MASS } from './player.js'
import type { PlayerCommon, PlayerOptions } from './player.js'
import { createEntity, dataManager } from '~/entity.js'
import type { Entity } from '~/entity.js'
import { v, Vec } from '~/math/vector.js'
import type { LooseVector } from '~/math/vector.js'

interface Data {
  physics: Engine
  body: Body
}

interface NetPlayer extends PlayerCommon, Entity<Data, unknown> {
  get id(): string
  get body(): Body

  setPosition(vector: LooseVector): void
  setVelocity(vector: LooseVector): void
}

export const createNetPlayer = ({
  width = 80,
  height = 370,
}: PlayerOptions = {}) => {
  const id = createId()

  const netPlayer: NetPlayer = createEntity<NetPlayer, Data, unknown>({
    get id(): string {
      return id
    },

    get position(): Vector {
      const { body } = dataManager.getData(this)
      return Vec.clone(body.position)
    },

    setPosition(vector: LooseVector) {
      const { body } = dataManager.getData(this)
      Matter.Body.setPosition(body, v(vector))
    },

    setVelocity(vector: LooseVector) {
      const { body } = dataManager.getData(this)
      Matter.Body.setVelocity(body, v(vector))
    },

    get body(): Body {
      const { body } = dataManager.getData(this)
      return body
    },

    init({ physics }) {
      const body = Matter.Bodies.rectangle(0, 0, width, height, {
        label: 'player',
        render: { visible: false },

        inertia: Number.POSITIVE_INFINITY,
        inverseInertia: 0,
        mass: PLAYER_MASS,
        inverseMass: 1 / PLAYER_MASS,
        friction: 0,
      })

      Matter.Composite.add(physics.world, body)

      return { physics, body }
    },

    initRenderContext() {
      // No-op
    },

    teardown({ physics, body }) {
      Matter.Composite.remove(physics.world, body)
    },

    teardownRenderContext() {
      // No-op
    },
  })

  return netPlayer
}
