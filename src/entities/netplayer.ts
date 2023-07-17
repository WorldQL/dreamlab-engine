import { createId } from '@paralleldrive/cuid2'
import Matter from 'matter-js'
import type { Body, Engine, Vector } from 'matter-js'
import { AnimatedSprite, Graphics } from 'pixi.js'
import type { Camera } from '~/entities/camera.js'
import {
  ANIMATION_SPEED,
  PLAYER_MASS,
  SPRITE_ANCHOR,
  SPRITE_SCALE,
} from '~/entities/player.js'
import type {
  Animation,
  PlayerCommon,
  PlayerOptions,
} from '~/entities/player.js'
import { createEntity, dataManager } from '~/entity.js'
import type { Entity } from '~/entity.js'
import { v, Vec } from '~/math/vector.js'
import type { LooseVector } from '~/math/vector.js'
import type { AnimationMap } from '~/textures/animations.js'
import type { Debug } from '~/utils/debug.js'
import { drawBox } from '~/utils/draw.js'

interface Data {
  debug: Debug
  physics: Engine
  body: Body
}

interface Render {
  camera: Camera

  sprite: AnimatedSprite
  gfxBounds: Graphics
}

export interface NetPlayer extends PlayerCommon, Entity<Data, Render> {
  get id(): string
  get body(): Body

  setPosition(vector: LooseVector): void
  setVelocity(vector: LooseVector): void
  setAnimation(animation: Animation): void
}

export const createNetPlayer = (
  animations: AnimationMap<Animation> | undefined,
  { width = 80, height = 370 }: PlayerOptions = {},
) => {
  const id = createId()
  let currentAnimation: Animation = 'idle'
  let animationChanged = false

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
      sprite.removeFromParent()
      gfxBounds.removeFromParent()

      sprite.destroy()
      gfxBounds.destroy()
    },

    onRenderFrame(_, { debug, body }, { camera, sprite, gfxBounds }) {
      if (!animations) {
        throw new Error(`missing animations for netplayer: ${id}`)
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
