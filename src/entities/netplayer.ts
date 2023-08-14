import { createId } from '@paralleldrive/cuid2'
import Matter from 'matter-js'
import type { Body, Vector } from 'matter-js'
import { AnimatedSprite, Graphics } from 'pixi.js'
import type { Camera } from '~/entities/camera.js'
import {
  ANIMATION_SPEED,
  PLAYER_MASS,
  SPRITE_ANCHOR,
  SPRITE_SCALE,
} from '~/entities/player.js'
import type {
  PlayerAnimation,
  PlayerCommon,
  PlayerSize,
} from '~/entities/player.js'
import { createEntity, dataManager, isEntity } from '~/entity.js'
import type { Entity } from '~/entity.js'
import { v, Vec } from '~/math/vector.js'
import type { LooseVector } from '~/math/vector.js'
import type { Physics } from '~/physics.js'
import type { AnimationMap } from '~/textures/animations.js'
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

  get id(): string
  get body(): Body

  setPosition(vector: LooseVector): void
  setVelocity(vector: LooseVector): void
  setFlipped(flipped: boolean): void
  setAnimation(animation: PlayerAnimation): void
}

export const createNetPlayer = (
  uid: string | undefined,
  animations: AnimationMap<PlayerAnimation> | undefined,
  { width = 80, height = 370 }: Partial<PlayerSize> = {},
) => {
  const id = uid ?? createId()

  let isFlipped = false
  let currentAnimation: PlayerAnimation = 'idle'
  let animationChanged = false

  const netPlayer: NetPlayer = createEntity<NetPlayer, Data, Render>({
    get [symbol]() {
      return true as const
    },

    get id(): string {
      return id
    },

    get position(): Vector {
      const { body } = dataManager.getData(this)
      return Vec.clone(body.position)
    },

    get size() {
      return { width, height }
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
        throw new Error(`missing animations for netplayer: ${id}`)
      }

      const sprite = new AnimatedSprite(animations[currentAnimation])
      sprite.animationSpeed = ANIMATION_SPEED
      sprite.scale.set(SPRITE_SCALE)
      sprite.anchor.set(...SPRITE_ANCHOR)
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

    onRenderFrame(_, { debug, body }, { camera, sprite, gfxBounds }) {
      if (!animations) {
        throw new Error(`missing animations for netplayer: ${id}`)
      }

      const scale = isFlipped ? -1 : 1
      const newScale = scale * SPRITE_SCALE
      if (sprite.scale.x !== newScale) {
        sprite.scale.x = newScale
      }

      if (animationChanged) {
        animationChanged = false
        sprite.textures = animations[currentAnimation]
        sprite.loop = currentAnimation !== 'jump'

        sprite.gotoAndPlay(0)
      }

      const pos = Vec.add(body.position, camera.offset)

      sprite.position = pos
      gfxBounds.position = pos
      gfxBounds.alpha = debug.value ? 0.5 : 0
    },
  })

  return netPlayer
}
