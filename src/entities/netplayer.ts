import { createId } from '@paralleldrive/cuid2'
import Matter from 'matter-js'
import type { Body } from 'matter-js'
import { AnimatedSprite, Graphics } from 'pixi.js'
import type { Camera } from '~/entities/camera.js'
import {
  PLAYER_ANIMATION_SPEED,
  PLAYER_MASS,
  PLAYER_SPRITE_ANCHOR,
  PLAYER_SPRITE_SCALE,
} from '~/entities/player.js'
import type {
  KnownPlayerAnimation,
  PlayerCommon,
  PlayerSize,
} from '~/entities/player.js'
import { createEntity, dataManager, isEntity } from '~/entity.js'
import type { Entity } from '~/entity.js'
import { v, Vec } from '~/math/vector.js'
import type { LooseVector, Vector } from '~/math/vector.js'
import type { Physics } from '~/physics.js'
import type { PlayerAnimationMap } from '~/textures/playerAnimations.js'
import type { Debug } from '~/utils/debug.js'
import { drawBox } from '~/utils/draw.js'

interface Data {
  debug: Debug
  physics: Physics
  body: Body
}

interface Render {
  camera: Camera

  sprite: AnimatedSprite
  gfxBounds: Graphics
}

const symbol = Symbol.for('@dreamlab/core/entities/netplayer')
export const isNetPlayer = (netplayer: unknown): netplayer is NetPlayer => {
  if (!isEntity(netplayer)) return false
  return symbol in netplayer && netplayer[symbol] === true
}

export interface NetPlayer extends PlayerCommon, Entity<Data, Render> {
  get [symbol](): true

  get peerID(): string
  get entityID(): string
  get body(): Body
  get weaponUrl(): string

  setPosition(vector: LooseVector): void
  setVelocity(vector: LooseVector): void
  setFlipped(flipped: boolean): void
  setAnimation(animation: KnownPlayerAnimation): void
}

export const createNetPlayer = (
  peerID: string,
  entityID: string | undefined,
  weaponUrl: string,
  animations: PlayerAnimationMap<KnownPlayerAnimation> | undefined,
  { width = 80, height = 370 }: Partial<PlayerSize> = {},
) => {
  const _entityID = entityID ?? createId()

  let isFlipped = false
  let currentAnimation: KnownPlayerAnimation = 'idle'
  let animationChanged = false

  const netPlayer: NetPlayer = createEntity<NetPlayer, Data, Render>({
    get [symbol]() {
      return true as const
    },

    get peerID(): string {
      return peerID
    },

    get entityID(): string {
      return _entityID
    },

    get position(): Vector {
      const { body } = dataManager.getData(this)
      return Vec.clone(body.position)
    },

    get size() {
      return { width, height }
    },

    get weaponUrl() {
      return weaponUrl
    },

    setPosition(vector: LooseVector) {
      const { body } = dataManager.getData(this)
      Matter.Body.setPosition(body, v(vector))
    },

    setVelocity(vector: LooseVector) {
      const { body } = dataManager.getData(this)
      Matter.Body.setVelocity(body, v(vector))
    },

    setFlipped(flipped) {
      isFlipped = flipped
    },

    setAnimation(animation) {
      currentAnimation = animation
      animationChanged = true
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
      if (!animations) {
        throw new Error(`missing animations for netplayer: ${_entityID}`)
      }

      const sprite = new AnimatedSprite(animations[currentAnimation].textures)
      sprite.animationSpeed = PLAYER_ANIMATION_SPEED
      sprite.scale.set(PLAYER_SPRITE_SCALE)
      sprite.anchor.set(...PLAYER_SPRITE_ANCHOR)
      sprite.play()

      const gfxBounds = new Graphics()
      drawBox(gfxBounds, { width, height }, { stroke: '#00f' })

      const zIndex = 5
      sprite.zIndex = zIndex
      gfxBounds.zIndex = zIndex + 1

      stage.addChild(sprite)
      stage.addChild(gfxBounds)

      return { camera, sprite, gfxBounds }
    },

    teardown({ physics, body }) {
      Matter.Composite.remove(physics.world, body)
    },

    teardownRenderContext({ sprite, gfxBounds }) {
      sprite.destroy()
      gfxBounds.destroy()
    },

    onRenderFrame({ smooth }, { debug, body }, { camera, sprite, gfxBounds }) {
      if (!animations) {
        throw new Error(`missing animations for netplayer: ${_entityID}`)
      }

      const scale = isFlipped ? -1 : 1
      const newScale = scale * PLAYER_SPRITE_SCALE
      if (sprite.scale.x !== newScale) {
        sprite.scale.x = newScale
      }

      if (animationChanged) {
        animationChanged = false
        sprite.textures = animations[currentAnimation].textures
        sprite.loop = currentAnimation !== 'jump'

        sprite.gotoAndPlay(0)
      }

      const smoothed = Vec.add(body.position, Vec.mult(body.velocity, smooth))
      const pos = Vec.add(smoothed, camera.offset)

      sprite.position = pos
      gfxBounds.position = pos
      gfxBounds.alpha = debug.value ? 0.5 : 0
    },
  })

  return netPlayer
}
