import Matter from 'matter-js'
import type { Body } from 'matter-js'
import { AnimatedSprite, Graphics } from 'pixi.js'
import type { Camera } from '~/entities/camera.js'
import type { Entity } from '~/entity.js'
import { createEntity, dataManager, isEntity } from '~/entity.js'
import type { InputManager } from '~/input/manager.js'
import { v, Vec } from '~/math/vector.js'
import type { LooseVector, Vector } from '~/math/vector.js'
import type { NetClient } from '~/network/client.js'
import { onlyNetClient } from '~/network/shared.js'
import type { Physics } from '~/physics.js'
import type { AnimationMap } from '~/textures/animations.js'
import type { Debug } from '~/utils/debug.js'
import { drawBox } from '~/utils/draw.js'
import { ref } from '~/utils/ref.js'
import type { Ref } from '~/utils/ref.js'

export const PLAYER_MASS = 50
export const SPRITE_SCALE = 0.9
export const ANIMATION_SPEED = 0.4
export const SPRITE_ANCHOR = [0.45, 0.535] as const

interface Data {
  debug: Debug
  inputs: InputManager | undefined
  physics: Physics
  network: NetClient | undefined

  body: Body
  direction: Ref<-1 | 0 | 1>
  facing: Ref<'left' | 'right'>
  colliding: Ref<boolean>
}

interface Render {
  camera: Camera

  sprite: AnimatedSprite
  gfxBounds: Graphics
  gfxFeet: Graphics
}

const symbol = Symbol.for('@dreamlab/core/entities/player')
export const isPlayer = (player: unknown): player is Player => {
  if (!isEntity(player)) return false
  return symbol in player && player[symbol] === true
}

export interface PlayerCommon {
  get position(): Vector
}

interface Player extends PlayerCommon, Entity<Data, Render> {
  get [symbol](): true
  teleport(position: LooseVector, resetVelocity?: boolean): void
}

export interface PlayerOptions {
  width?: number
  height?: number
}

export type PlayerAnimation = 'idle' | 'jump' | 'walk'

export const createPlayer = (
  animations: AnimationMap<PlayerAnimation>,
  { width = 80, height = 370 }: PlayerOptions = {},
) => {
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

  let currentAnimation: PlayerAnimation = 'idle'
  const getAnimation = (direction: number): PlayerAnimation => {
    if (noclip) return 'idle'
    if (hasJumped) return 'jump'
    if (direction !== 0) return 'walk'

    return 'idle'
  }

  const player: Player = createEntity({
    get [symbol]() {
      return true as const
    },

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
      const inputs = game.inputs
      const network = onlyNetClient(game.network)

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
      inputs?.addListener('KeyV', onToggleNoclip) // TODO: Remap

      return {
        debug,
        inputs,
        physics,
        network,
        body,
        direction: ref(0),
        facing: ref('left'),
        colliding: ref(false),
      }
    },

    initRenderContext(_, { stage, camera }) {
      const sprite = new AnimatedSprite(animations[currentAnimation])
      sprite.animationSpeed = ANIMATION_SPEED
      sprite.scale.set(SPRITE_SCALE)
      sprite.anchor.set(...SPRITE_ANCHOR)
      sprite.play()

      const gfxBounds = new Graphics()
      const gfxFeet = new Graphics()

      sprite.zIndex = 10
      gfxBounds.zIndex = sprite.zIndex + 1
      gfxFeet.zIndex = sprite.zIndex + 2

      drawBox(gfxBounds, { width, height }, { stroke: '#00f' })

      stage.addChild(sprite)
      stage.addChild(gfxBounds)
      stage.addChild(gfxFeet)

      return { camera, sprite, gfxBounds, gfxFeet }
    },

    teardown({ inputs, physics, body }) {
      inputs?.removeListener('KeyV', onToggleNoclip) // TODO: Remap
      Matter.Composite.remove(physics.world, body)
    },

    teardownRenderContext({ sprite, gfxBounds, gfxFeet }) {
      sprite.removeFromParent()
      gfxBounds.removeFromParent()
      gfxFeet.removeFromParent()

      sprite.destroy()
      gfxBounds.destroy()
      gfxFeet.destroy()
    },

    onPhysicsStep(
      { delta },
      { inputs, physics, network, body, direction, facing, colliding },
    ) {
      // TODO: Remap
      const left = inputs?.getKey('KeyA') ?? false
      const right = inputs?.getKey('KeyD') ?? false
      const jump = inputs?.getKey('KeyW') ?? false
      const crouch = inputs?.getKey('KeyS') ?? false

      direction.value = left ? -1 : right ? 1 : 0
      const xor = left ? !right : right

      if (direction.value !== 0) {
        const _facing = direction.value === -1 ? 'left' : 'right'
        facing.value = _facing
      }

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

      network?.sendPlayerPosition(
        body.position,
        body.velocity,
        facing.value !== 'left',
      )
    },

    onRenderFrame(
      _,
      {
        debug,
        body,
        network,
        direction: { value: direction },
        facing: { value: facing },
        colliding: { value: colliding },
      },
      { camera, sprite, gfxBounds, gfxFeet },
    ) {
      const scale = facing === 'left' ? 1 : -1
      const newScale = scale * SPRITE_SCALE
      if (sprite.scale.x !== newScale) {
        sprite.scale.x = newScale
      }

      const newAnimation = getAnimation(direction)
      if (newAnimation !== currentAnimation) {
        currentAnimation = newAnimation
        sprite.textures = animations[newAnimation]
        sprite.loop = newAnimation !== 'jump'

        sprite.gotoAndPlay(0)
        network?.sendPlayerAnimation(newAnimation)
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
