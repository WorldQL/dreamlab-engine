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
  colliding: { value: boolean }
}

interface Render {
  camera: Camera

  gfxBounds: Graphics
  gfxFeet: Graphics
}

interface Player extends Entity<Data, Render> {
  get position(): Vector
}

export interface PlayerOptions {
  width?: number
  height?: number
}

type Inputs = 'crouch' | 'jump' | 'left' | 'right' | 'toggle-noclip'
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

  let noclip = false
  const noclipSpeed = 15

  const onToggleNoclip = (pressed: boolean) => {
    if (pressed) noclip = !noclip
  }

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

      return { debug, physics, body, colliding: { value: false } }
    },

    initRenderContext(_, { stage, camera }) {
      const gfxBounds = new Graphics()
      const gfxFeet = new Graphics()

      gfxBounds.zIndex = 11
      gfxFeet.zIndex = 12

      inputs.addListener('toggle-noclip', onToggleNoclip)
      drawBox(gfxBounds, { width, height }, { stroke: '#00f' })

      stage.addChild(gfxBounds)
      stage.addChild(gfxFeet)

      return { camera, gfxBounds, gfxFeet }
    },

    teardown({ physics, body }) {
      Composite.remove(physics.world, body)
    },

    teardownRenderContext({ gfxBounds, gfxFeet }) {
      inputs.removeListener('toggle-noclip', onToggleNoclip)

      gfxBounds.removeFromParent()
      gfxFeet.removeFromParent()

      gfxBounds.destroy()
      gfxFeet.destroy()
    },

    onPhysicsStep(_time, { physics, body, colliding }) {
      const left = inputs.getInput('left')
      const right = inputs.getInput('right')
      const jump = inputs.getInput('jump')
      const crouch = inputs.getInput('crouch')

      const direction = left ? -1 : right ? 1 : 0
      const xor = left ? !right : right

      body.isStatic = noclip
      if (noclip) {
        const movement = Vector.create()

        if (left) movement.x -= 1
        if (right) movement.x += 1
        if (jump) movement.y -= 1
        if (crouch) movement.y += 1

        const newPosition = Vector.add(
          body.position,
          Vector.mult(movement, noclipSpeed),
        )

        Body.setPosition(body, newPosition)
        Body.setVelocity(body, Vector.create())
      } else {
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
        colliding.value = isColliding

        if (isColliding && jump && !hasJumped) {
          hasJumped = true
          Body.applyForce(body, body.position, Vector.create(0, -1 * jumpForce))
        }

        if (!jump) hasJumped = false
      }
    },

    onRenderFrame(
      _,
      { debug, body, colliding: { value: colliding } },
      { camera, gfxBounds, gfxFeet },
    ) {
      const pos = Vector.add(body.position, camera.offset)

      gfxBounds.position = pos
      gfxBounds.alpha = debug.value ? 0.5 : 0

      const inactive = '#f00'
      const active = '#0f0'

      gfxFeet.alpha = debug.value ? 0.5 : 0
      gfxFeet.position = Vector.add(
        pos,
        Vector.create(0, height / 2 - feetSensor / 2),
      )

      drawBox(
        gfxFeet,
        { width: width - feetSensor, height: feetSensor },
        { strokeAlpha: 0, fill: colliding ? active : inactive, fillAlpha: 1 },
      )
    },
  })

  return player
}
