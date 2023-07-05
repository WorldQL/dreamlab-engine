import { createId } from '@paralleldrive/cuid2'
import Matter from 'matter-js'
import type { Body, Engine, Vector } from 'matter-js'
import { Graphics } from 'pixi.js'
import { PLAYER_MASS } from './player.js'
import type { PlayerCommon, PlayerOptions } from './player.js'
import type { Camera } from '~/entities/camera.js'
import { createEntity, dataManager } from '~/entity.js'
import type { Entity } from '~/entity.js'
import { v, Vec } from '~/math/vector.js'
import type { LooseVector } from '~/math/vector.js'
import type { Debug } from '~/utils/debug.js'
import { drawBox } from '~/utils/draw.js'

interface Data {
  debug: Debug
  physics: Engine
  body: Body
}

interface Render {
  camera: Camera

  // sprite: AnimatedSprite
  gfxBounds: Graphics
}

interface NetPlayer extends PlayerCommon, Entity<Data, Render> {
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

  const netPlayer: NetPlayer = createEntity<NetPlayer, Data, Render>({
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

    init({ game, physics }) {
      const debug = game.debug

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

      return { debug, physics, body }
    },

    initRenderContext(_, { stage, camera }) {
      const gfxBounds = new Graphics()

      gfxBounds.zIndex = 6 // Set sprite to 5 and change to "+ 1"
      drawBox(gfxBounds, { width, height }, { stroke: '#00f' })
      stage.addChild(gfxBounds)

      return { camera, gfxBounds }
    },

    teardown({ physics, body }) {
      Matter.Composite.remove(physics.world, body)
    },

    teardownRenderContext({ gfxBounds }) {
      gfxBounds.removeFromParent()
      gfxBounds.destroy()
    },

    onRenderFrame(_, { debug, body }, { camera, gfxBounds }) {
      const pos = Vec.add(body.position, camera.offset)

      gfxBounds.position = pos
      gfxBounds.alpha = debug.value ? 0.5 : 0
    },
  })

  return netPlayer
}
