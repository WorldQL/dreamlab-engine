import Matter from 'matter-js'
import type { Body, Engine } from 'matter-js'
import { AnimatedSprite, Graphics } from 'pixi.js'
import type { Camera } from '~/entities/camera.js'
import type { Entity } from '~/entity.js'
import { createEntity, dataManager } from '~/entity.js'
import type { RequiredInputs } from '~/input/emitter.js'
import { v, Vec } from '~/math/vector.js'
import type { LooseVector, Vector } from '~/math/vector.js'
import type { AnimationMap } from '~/textures/animations'
import type { Debug } from '~/utils/debug.js'
import { drawBox } from '~/utils/draw.js'
import { ref } from '~/utils/ref.js'
import type { Ref } from '~/utils/ref.js'

export const PLAYER_MASS = 50

interface Data {
  debug: Debug
  physics: Engine

  body: Body
  direction: Ref<number>
  colliding: Ref<boolean>
}

interface Render {
  camera: Camera

  sprite: AnimatedSprite
  gfxBounds: Graphics
  gfxFeet: Graphics
}

export interface PlayerCommon {
  get position(): Vector
}

interface Player extends PlayerCommon, Entity<Data, Render> {
  teleport(position: LooseVector, resetVelocity?: boolean): void
}

export interface PlayerOptions {
  width?: number
  height?: number
}

type Inputs = 'crouch' | 'jump' | 'left' | 'right' | 'toggle-noclip'
type Animations = 'idle' | 'jump' | 'walk'

export const createPlayer = (
  inputs: RequiredInputs<Inputs>,
  animations: AnimationMap<Animations>,
  { width = 80, height = 370 }: PlayerOptions = {},
) => {
  const spriteScale = 0.9
  const animationSpeed = 0.4

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

  let currentAnimation: Animations = 'idle'
  const getAnimation = (direction: number): Animations => {
    if (noclip) return 'idle'
    if (hasJumped) return 'jump'
    if (direction !== 0) return 'walk'

    return 'idle'
  }

  const player: Player = createEntity({
    get position(): Vector {
      const { body } = dataManager.getData(this)
      return Vec.clone(body.position)
    },

    teleport(position: LooseVector, resetVelocity = true) {
      const { body } = dataManager.getData(this)

      Matter.Body.setPosition(body, v(position))
      if (resetVelocity) Matter.Body.setVelocity(body, { x: 0, y: 0 })
    },

    init({ game, physics }) {
      const debug = game.debug

      // TODO: Reimplement spawnpoints
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

      return {
        debug,
        physics,
        body,
        direction: ref(0),
        colliding: ref(false),
      }
    },

    initRenderContext(_, { stage, camera }) {
      const sprite = new AnimatedSprite(animations[currentAnimation])
      sprite.animationSpeed = animationSpeed
      sprite.scale.set(spriteScale)
      sprite.anchor.set(0.45, 0.535)
      sprite.play()

      const gfxBounds = new Graphics()
      const gfxFeet = new Graphics()

      sprite.zIndex = 10
      gfxBounds.zIndex = sprite.zIndex + 1
      gfxFeet.zIndex = sprite.zIndex + 2

      inputs.addListener('toggle-noclip', onToggleNoclip)
      drawBox(gfxBounds, { width, height }, { stroke: '#00f' })

      stage.addChild(sprite)
      stage.addChild(gfxBounds)
      stage.addChild(gfxFeet)

      return { camera, sprite, gfxBounds, gfxFeet }
    },

    teardown({ physics, body }) {
      Matter.Composite.remove(physics.world, body)
    },

    teardownRenderContext({ sprite, gfxBounds, gfxFeet }) {
      inputs.removeListener('toggle-noclip', onToggleNoclip)

      sprite.removeFromParent()
      gfxBounds.removeFromParent()
      gfxFeet.removeFromParent()

      sprite.destroy()
      gfxBounds.destroy()
      gfxFeet.destroy()
    },

    onPhysicsStep({ delta }, { physics, body, direction, colliding }) {
      const left = inputs.getInput('left')
      const right = inputs.getInput('right')
      const jump = inputs.getInput('jump')
      const crouch = inputs.getInput('crouch')

      direction.value = left ? -1 : right ? 1 : 0
      const xor = left ? !right : right

      body.isStatic = noclip
      if (noclip) {
        const movement = Vec.create()

        if (left) movement.x -= 1
        if (right) movement.x += 1
        if (jump) movement.y -= 1
        if (crouch) movement.y += 1

        const newPosition = Vec.add(
          body.position,
          Vec.mult(movement, noclipSpeed * delta * 50),
        )

        Matter.Body.setPosition(body, newPosition)
        Matter.Body.setVelocity(body, Vec.create())
      } else {
        if (xor) {
          const targetVelocity = maxSpeed * direction.value
          if (targetVelocity !== 0) {
            const velocityVector = targetVelocity / body.velocity.x
            const forcePercent = Math.min(Math.abs(velocityVector) / 2, 1)
            const newForce = moveForce * forcePercent * direction.value

            Matter.Body.applyForce(body, body.position, Vec.create(newForce, 0))
          }
        }

        if (Math.sign(body.velocity.x) !== direction.value) {
          Matter.Body.applyForce(
            body,
            body.position,
            Vec.create(-body.velocity.x / 20, 0),
          )
        }

        const minVelocity = 0.000_01
        if (Math.abs(body.velocity.x) <= minVelocity) {
          Matter.Body.setVelocity(body, Vec.create(0, body.velocity.y))
        }

        const feet = Matter.Bodies.rectangle(
          body.position.x,
          body.position.y + height / 2 - feetSensor / 2,
          width - feetSensor,
          feetSensor,
        )

        const bodies = physics.world.bodies
          .filter(other => other !== body)
          .filter(other => !other.isSensor)
          .filter(other =>
            Matter.Detector.canCollide(
              body.collisionFilter,
              other.collisionFilter,
            ),
          )

        const query = Matter.Query.region(bodies, feet.bounds)
        const isColliding = query.length > 0
        colliding.value = isColliding

        if (isColliding && jump && !hasJumped) {
          hasJumped = true
          Matter.Body.applyForce(
            body,
            body.position,
            Vec.create(0, -1 * jumpForce),
          )
        }

        if (!jump && isColliding) hasJumped = false
      }
    },

    onRenderFrame(
      _,
      {
        debug,
        body,
        direction: { value: direction },
        colliding: { value: colliding },
      },
      { camera, sprite, gfxBounds, gfxFeet },
    ) {
      const newScale = -direction * spriteScale
      if (newScale !== 0 && sprite.scale.x !== newScale) {
        sprite.scale.x = newScale
      }

      const newAnimation = getAnimation(direction)
      if (newAnimation !== currentAnimation) {
        currentAnimation = newAnimation
        sprite.textures = animations[newAnimation]
        sprite.loop = newAnimation !== 'jump'

        sprite.gotoAndPlay(0)
      }

      const pos = Vec.add(body.position, camera.offset)

      sprite.position = pos
      gfxBounds.position = pos
      gfxBounds.alpha = debug.value ? 0.5 : 0

      const inactive = '#f00'
      const active = '#0f0'

      gfxFeet.alpha = debug.value ? 0.5 : 0
      gfxFeet.position = Vec.add(
        pos,
        Vec.create(0, height / 2 - feetSensor / 2),
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
