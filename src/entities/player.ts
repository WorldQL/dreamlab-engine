import type { Engine } from 'matter-js'
import { Bodies, Body, Composite, Detector, Query } from 'matter-js'
import { Graphics } from 'pixi.js'
import type { Camera } from '~/entities/camera.js'
import type { Entity } from '~/entity.js'
import { createEntity, dataManager } from '~/entity.js'
import type { RequiredInputs } from '~/input/emitter.js'
import { Vector } from '~/math/vector.js'
import type { Debug } from '~/utils/debug.js'
import { drawBox } from '~/utils/draw.js'

interface Data {
  debug: Debug
  physics: Engine

  body: Body
}

interface Render {
  camera: Camera

  gfxBounds: Graphics
}

interface Player extends Entity<Data, Render> {
  get position(): Vector
}

export interface PlayerOptions {
  width?: number
  height?: number
}

type Inputs = 'jump' | 'left' | 'right' | 'toggle-noclip'
export const createPlayer = (
  inputs: RequiredInputs<Inputs>,
  { width = 80, height = 370 }: PlayerOptions = {},
) => {
  const mass = 50
  const moveForce = 0.5
  const maxSpeed = 1
  const jumpForce = 5
  const feetSensor = 4

  let hasJumped = false

  const player: Player = createEntity({
    get position(): Vector {
      const { body } = dataManager.getData(this)
      return Vector.clone(body.position)
    },

    init({ game, physics }) {
      const debug = game.debug

      // TODO: Reimplement spawnpoints
      const body = Bodies.rectangle(0, 0, width, height, {
        label: 'player',
        render: { visible: false },

        inertia: Number.POSITIVE_INFINITY,
        inverseInertia: 0,
        mass,
        inverseMass: 1 / mass,
        friction: 0,

        // collisionFilter: {
        //   category: playerLayer,
        // },
      })

      Composite.add(physics.world, body)

      return { debug, physics, body }
    },

    initRenderContext(_, { stage, camera }) {
      const gfxBounds = new Graphics()

      drawBox(gfxBounds, { width, height })
      stage.addChild(gfxBounds)

      inputs.addListener('toggle-noclip', onToggleNoclip)

      return { camera, gfxBounds }
    },

    teardown({ physics, body }) {
      Composite.remove(physics.world, body)
    },

    teardownRenderContext({ gfxBounds }) {
      inputs.removeListener('toggle-noclip', onToggleNoclip)

      gfxBounds.removeFromParent()
      gfxBounds.destroy()
    },

    onPhysicsStep(_time, { physics, body }) {
      const left = inputs.getInput('left')
      const right = inputs.getInput('right')

      const direction = left ? -1 : right ? 1 : 0
      const xor = left ? !right : right

      // TODO: Noclip

      if (xor) {
        const targetVelocity = maxSpeed * direction
        if (targetVelocity !== 0) {
          const velocityVector = targetVelocity / body.velocity.x
          const forcePercent = Math.min(Math.abs(velocityVector) / 2, 1)
          const newForce = moveForce * forcePercent * direction

          Body.applyForce(body, body.position, Vector.create(newForce, 0))
        }
      }

      if (Math.sign(body.velocity.x) !== direction) {
        Body.applyForce(
          body,
          body.position,
          Vector.create(-body.velocity.x / 20, 0),
        )
      }

      const minVelocity = 0.000_01
      if (Math.abs(body.velocity.x) <= minVelocity) {
        Body.setVelocity(body, Vector.create(0, body.velocity.y))
      }

      const feet = Bodies.rectangle(
        body.position.x,
        body.position.y + height / 2 - feetSensor / 2,
        width - feetSensor,
        feetSensor,
      )

      const bodies = physics.world.bodies
        .filter(other => other !== body)
        .filter(other => !other.isSensor)
        .filter(other =>
          Detector.canCollide(body.collisionFilter, other.collisionFilter),
        )

      const query = Query.region(bodies, feet.bounds)
      const isColliding = query.length > 0

      const jumpPressed = inputs.getInput('jump')
      if (isColliding && jumpPressed && !hasJumped) {
        hasJumped = true
        Body.applyForce(body, body.position, Vector.create(0, -1 * jumpForce))
      }

      if (!jumpPressed) {
        hasJumped = false
      }
    },

    onRenderFrame(_, { debug, body }, { camera, gfxBounds }) {
      const pos = Vector.add(body.position, camera.offset)

      gfxBounds.position = pos
      gfxBounds.alpha = debug.value ? 0.5 : 0
    },
  })

  return player
}
