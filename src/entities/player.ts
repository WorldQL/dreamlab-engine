import Matter from 'matter-js'
import { AnimatedSprite, Graphics } from 'pixi.js'
import type { Camera } from '~/entities/camera.js'
import type { Entity } from '~/entity.js'
import { createEntity, isEntity } from '~/entity.js'
import type { InputManager } from '~/input/manager.js'
import { v, Vec } from '~/math/vector.js'
import type { LooseVector, Vector } from '~/math/vector.js'
import type { NetClient } from '~/network/client.js'
import { onlyNetClient } from '~/network/shared.js'
import type { Physics } from '~/physics.js'
import { bones } from '~/textures/playerAnimations.js'
import type { Bone, PlayerAnimationMap } from '~/textures/playerAnimations.js'
import { createSprite } from '~/textures/sprites.js'
import type { Debug } from '~/utils/debug.js'
import { drawBox } from '~/utils/draw.js'
import { ref } from '~/utils/ref.js'
import type { Ref } from '~/utils/ref.js'

export const PLAYER_MASS = 50
export const PLAYER_SPRITE_SCALE = 0.9
export const PLAYER_ANIMATION_SPEED = 0.4
export const PLAYER_SPRITE_ANCHOR = [0.45, 0.535] as const

interface Data {
  debug: Debug
  inputs: InputManager | undefined
  physics: Physics
  network: NetClient | undefined

  direction: Ref<-1 | 0 | 1>
  facing: Ref<'left' | 'right'>
  colliding: Ref<boolean>
  weaponColliding: Ref<boolean>
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
  get size(): PlayerSize
}

export interface Player extends PlayerCommon, Entity<Data, Render> {
  get [symbol](): true
  get bones(): Readonly<Record<Bone, Vector>>

  teleport(position: LooseVector, resetVelocity?: boolean): void
}

export interface PlayerSize {
  width: number
  height: number
}

export type KnownPlayerAnimation = 'attack' | 'idle' | 'jump' | 'walk'
export enum PlayerInput {
  Attack = '@player/attack',
  Crouch = '@player/crouch',
  Jump = '@player/jump',
  ToggleNoclip = '@player/toggle-noclip',
  WalkLeft = '@player/walk-left',
  WalkRight = '@player/walk-right',
}

export const createPlayer = (
  animations: PlayerAnimationMap<KnownPlayerAnimation>,
  { width = 80, height = 370 }: Partial<PlayerSize> = {},
) => {
  const moveForce = 0.5
  const maxSpeed = 1
  const jumpForce = 5
  const feetSensor = 4

  let hasJumped = false

  let noclip = false
  const noclipSpeed = 15
  let attack = false

  const weaponSprite = createSprite(
    'https://dreamlab-user-assets.s3.us-east-1.amazonaws.com/path-in-s3/1693261056400.png',
    { width: 150, height: 150 },
  )

  const weaponBody = Matter.Bodies.rectangle(
    weaponSprite.x,
    weaponSprite.y,
    150,
    150,
    {
        label: 'weapon',
        render: { visible: false },
        isSensor: true
    }
);

  const gfxWeaponBounds = new Graphics()

  const onToggleNoclip = (pressed: boolean) => {
    // TODO(Charlotte): if a player is noclipping, we should network this
    // so that the serverside prediction can take that into account
    if (pressed) noclip = !noclip
  }

  let currentAnimation: KnownPlayerAnimation = 'idle'
  let spriteSign = 1
  let currentFrame = 0

  const body = Matter.Bodies.rectangle(0, 0, width, height, {
    label: 'player',
    render: { visible: false },

    inertia: Number.POSITIVE_INFINITY,
    inverseInertia: 0,
    mass: PLAYER_MASS,
    inverseMass: 1 / PLAYER_MASS,
    friction: 0,
  })

  const getAnimation = (direction: number): KnownPlayerAnimation => {
    if (noclip) return 'idle'
    if (hasJumped) return 'jump'
    if (attack) return 'attack'
    if (direction !== 0) return 'walk'

    return 'idle'
  }

  const bonePosition = (bone: Bone): Vector => {
    const animation = animations[currentAnimation]

    const animW = animation.width
    const animH = animation.height
    const position = animation.boneData.bones[bone][currentFrame]!

    const flip = spriteSign
    const normalized = {
      x: flip === 1 ? position.x : animW - position.x,
      y: position.y,
    }

    const offsetFromCenter: Vector = {
      x: (1 - (normalized.x / animW) * 2) * (animW / -2),
      y: (1 - (normalized.y / animH) * 2) * (animH / -2),
    }

    const offsetFromAnchor = Vec.add(offsetFromCenter, {
      x: flip * ((1 - PLAYER_SPRITE_ANCHOR[0] * 2) * (animW / 2)),
      y: (1 - PLAYER_SPRITE_ANCHOR[1] * 2) * (animH / 2),
    })

    const scaled = Vec.mult(offsetFromAnchor, PLAYER_SPRITE_SCALE)
    return Vec.add(body.position, scaled)
  }

  const boneMap = {} as Readonly<Record<Bone, Vector>>
  for (const bone of bones) {
    Object.defineProperty(boneMap, bone, {
      get: () => bonePosition(bone),
    })
  }

  Object.freeze(boneMap)


  const player: Player = createEntity({
    get [symbol]() {
      return true as const
    },

    get position(): Vector {
      return Vec.clone(body.position)
    },

    get size() {
      return { width, height }
    },

    get bones(): Readonly<Record<Bone, Vector>> {
      return boneMap
    },

    teleport(position: LooseVector, resetVelocity = true) {
      Matter.Body.setPosition(body, v(position))
      if (resetVelocity) Matter.Body.setVelocity(body, { x: 0, y: 0 })
    },

    init({ game, physics }) {
      const debug = game.debug
      const inputs = game.client?.inputs
      const network = onlyNetClient(game)

      // TODO: Reimplement spawnpoints

      Matter.Composite.add(physics.world, body)


      Matter.Composite.add(physics.world, weaponBody)


      if (inputs) {
        inputs.registerInput(PlayerInput.WalkLeft, 'KeyA')
        inputs.registerInput(PlayerInput.Attack, 'KeyE')
        inputs.registerInput(PlayerInput.WalkRight, 'KeyD')
        inputs.registerInput(PlayerInput.Jump, 'Space')
        inputs.registerInput(PlayerInput.Crouch, 'KeyS')
        inputs.registerInput(PlayerInput.ToggleNoclip, 'KeyV')

        inputs.addListener(PlayerInput.ToggleNoclip, onToggleNoclip)
      }

      return {
        debug,
        inputs,
        physics,
        network,
        direction: ref(0),
        facing: ref('left'),
        colliding: ref(false),
        weaponColliding: ref(false),
      }
    },

    initRenderContext(_, { stage, camera }) {
      const sprite = new AnimatedSprite(animations[currentAnimation].textures)
      sprite.animationSpeed = PLAYER_ANIMATION_SPEED
      sprite.scale.set(PLAYER_SPRITE_SCALE)
      sprite.anchor.set(...PLAYER_SPRITE_ANCHOR)
      sprite.play()

      const gfxBounds = new Graphics()
      const gfxFeet = new Graphics()

      sprite.zIndex = 10
      gfxBounds.zIndex = sprite.zIndex + 1
      gfxFeet.zIndex = sprite.zIndex + 2

      drawBox(gfxBounds, { width, height }, { stroke: '#00f' })
      drawBox(gfxWeaponBounds, { width, height }, { stroke: '#00f' })

      stage.addChild(sprite)
      stage.addChild(weaponSprite, gfxWeaponBounds)
      stage.addChild(gfxBounds)
      stage.addChild(gfxFeet)

      return { camera, sprite, gfxBounds, gfxWeaponBounds, gfxFeet }
    },

    teardown({ inputs, physics }) {
      inputs?.removeListener(PlayerInput.ToggleNoclip, onToggleNoclip)
      Matter.Composite.remove(physics.world, body)
    },

    teardownRenderContext({ sprite, gfxBounds, gfxFeet }) {
      sprite.destroy()
      weaponSprite.destroy()
      gfxBounds.destroy()
      gfxFeet.destroy()
    },

    onPhysicsStep(
      { delta },
      { inputs, physics, network, direction, facing, colliding, weaponColliding },
    ) {
      const left = inputs?.getInput(PlayerInput.WalkLeft) ?? false
      const right = inputs?.getInput(PlayerInput.WalkRight) ?? false
      const jump = inputs?.getInput(PlayerInput.Jump) ?? false
      attack = inputs?.getInput(PlayerInput.Attack) ?? false
      const crouch = inputs?.getInput(PlayerInput.Crouch) ?? false

      direction.value = left ? -1 : right ? 1 : 0
      const xor = left ? !right : right

      if (direction.value !== 0) {
        const _facing = direction.value === -1 ? 'left' : 'right'
        facing.value = _facing
      }

      // TODO(Charlotte): factor out movement code into its own place,
      // so that we can apply it to NetPlayers for prediction (based on inputs)
      // on both the client and server

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
      network?.sendPlayerMotionInputs(jump, crouch, left, right, attack)


      if(attack) {
        const swordBodies = physics.world.bodies
            .filter(other => other !== body)
            .filter(other => !other.isSensor)
            .filter(other => Matter.Detector.canCollide(
              weaponBody.collisionFilter,
                other.collisionFilter
            ));

        const swordQuery = Matter.Query.region(swordBodies, weaponBody.bounds);
        const isSwordColliding = swordQuery.length > 0;
        weaponColliding.value = isSwordColliding

        if(isSwordColliding) {
          for (const collidedEntity of swordQuery) {
              const label = collidedEntity.label;
              network?.sendCustomMessage("@dreamlab/Hittable/hit", {label});
              console.log("Sending hit packet for:", label);
          }
      }

    }
    },


    onRenderFrame(
      _,
      {
        debug,
        network,
        direction: { value: direction },
        facing: { value: facing },
        colliding: { value: colliding },
        weaponColliding: { value: weaponColliding },
      },
      { camera, sprite, gfxBounds, gfxFeet },
    ) {
      const scale = facing === 'left' ? 1 : -1
      const newScale = scale * PLAYER_SPRITE_SCALE
      if (sprite.scale.x !== newScale) {
        sprite.scale.x = newScale
        spriteSign = Math.sign(sprite.scale.x)
      }

      const newAnimation = getAnimation(direction)
      if (newAnimation !== currentAnimation) {
        currentAnimation = newAnimation
        sprite.textures = animations[newAnimation].textures
        sprite.animationSpeed =
          currentAnimation === 'attack'
            ? PLAYER_ANIMATION_SPEED * 5
            : PLAYER_ANIMATION_SPEED
        sprite.loop = newAnimation !== 'jump'

        sprite.gotoAndPlay(0)
        network?.sendPlayerAnimation(newAnimation)
      }

      currentFrame = sprite.currentFrame
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

      if (weaponSprite) {
        const pos = Vec.add(
          { x: boneMap.handLeft.x, y: boneMap.handLeft.y },
          camera.offset,
        )
        weaponSprite.position = pos

        const animation = animations[currentAnimation]

        const lefthand_axisX_x =
          animation.boneData.handOffsets.handLeft[currentFrame]!.x.x
        const lefthand_axisX_y =
          animation.boneData.handOffsets.handLeft[currentFrame]!.x.y
        const lefthand_axisY_x =
          animation.boneData.handOffsets.handLeft[currentFrame]!.y.x
        const lefthand_axisY_y =
          animation.boneData.handOffsets.handLeft[currentFrame]!.y.y

        let rotation = Math.atan2(
          lefthand_axisY_y - lefthand_axisX_y,
          lefthand_axisY_x - lefthand_axisX_x,
        )

        if (scale === -1) {
          rotation = -rotation
        }

        weaponSprite.rotation = rotation
        const initialWidth = weaponSprite.width
        const initialHeight = weaponSprite.height

        weaponSprite.scale.x = -scale

        weaponSprite.width = initialWidth
        weaponSprite.height = initialHeight

        weaponSprite.anchor.set(0, 1)

        Matter.Body.setAngle(weaponBody, rotation)

        gfxWeaponBounds.position = weaponSprite
        gfxWeaponBounds.alpha = debug.value ? 0.5 : 0

        const inactive = '#f00'
        const active = '#0f0'

        drawBox(
          gfxWeaponBounds,
          { width:150, height: 150 },
          { strokeAlpha: 0, fill: weaponColliding ? active : inactive, fillAlpha: 1 },
        )
      }

    },
  })

  return player
}
