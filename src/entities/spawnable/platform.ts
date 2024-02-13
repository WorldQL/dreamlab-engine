import Matter from 'matter-js'
import { Container, Graphics } from 'pixi.js'
import type { Sprite } from 'pixi.js'
import { z } from 'zod'
import type { Camera } from '~/entities/camera.js'
import { isNetPlayer, isPlayer } from '~/entities/player'
import type { Game } from '~/game.js'
import { createSpawnableEntity } from '~/labs/compat'
import type { LegacySpawnableEntity as SpawnableEntity } from '~/labs/compat'
import { toRadians } from '~/math/general.js'
import { Vec } from '~/math/vector.js'
import type { Physics } from '~/physics.js'
import {
  updateBodyWidthHeight,
  updateSpriteSource,
  updateSpriteWidthHeight,
} from '~/spawnable/args.js'
import { createSprite, SpriteSourceSchema } from '~/textures/sprites.js'
import type { Debug } from '~/utils/debug.js'
import { drawBox } from '~/utils/draw.js'
import type { RedrawBox } from '~/utils/draw.js'

type Args = typeof ArgsSchema
export const ArgsSchema = z.object({
  width: z.number().positive().min(1).default(100),
  height: z.number().positive().min(1).default(100),
  spriteSource: SpriteSourceSchema.optional(),
})

interface Data {
  game: Game<boolean>
  debug: Debug
  physics: Physics
  body: Matter.Body
}

interface Render {
  camera: Camera
  container: Container
  gfx: Graphics
  redrawGfx: RedrawBox
  sprite: Sprite | undefined
}

export const createPlatform = createSpawnableEntity<
  Args,
  SpawnableEntity<Data, Render, Args>,
  Data,
  Render
>(ArgsSchema, ({ _this, transform }, args) => {
  const body = Matter.Bodies.rectangle(
    transform.position.x,
    transform.position.y,
    args.width,
    args.height,
    {
      label: 'platform',
      render: { visible: true },
      angle: toRadians(transform.rotation),

      isStatic: true,
      friction: 0,
    },
  )

  let isPlatformActive = false

  return {
    rectangleBounds() {
      return { width: args.width, height: args.height }
    },

    isPointInside(position) {
      return Matter.Query.point([body], position).length > 0
    },

    init({ game, physics }) {
      const debug = game.debug
      physics.register(_this, body)
      physics.linkTransform(body, transform)

      return { game, debug, physics, body }
    },

    initRenderContext(_, { camera, stage }) {
      const { width, height, spriteSource } = args

      const container = new Container()
      container.sortableChildren = true
      container.zIndex = transform.zIndex

      const gfx = new Graphics()
      gfx.zIndex = 100
      const redrawGfx = drawBox(gfx, { width: args.width, height: args.height })

      const sprite = spriteSource
        ? createSprite(spriteSource, { width, height })
        : undefined

      container.addChild(gfx)
      if (sprite) container.addChild(sprite)
      stage.addChild(container)

      transform.addZIndexListener(() => {
        container.zIndex = transform.zIndex
      })

      return { camera, container, gfx, redrawGfx, sprite }
    },

    onArgsUpdate(path, previous, _data, render) {
      updateBodyWidthHeight(path, body, args, previous)
      updateSpriteWidthHeight(path, render?.sprite, args)

      if (render && (path === 'width' || path === 'height')) {
        render.redrawGfx(args)
      }

      updateSpriteSource(
        path,
        'sprite',
        'spriteSource',
        'container',
        args,
        render,
      )
    },

    onResize({ width, height }) {
      args.width = width
      args.height = height
    },

    teardown({ physics }) {
      physics.unregister(_this, body)
    },

    teardownRenderContext({ container }) {
      container.destroy({ children: true })
    },

    onPhysicsStep(_, { game }) {
      // Don't run on the server
      if (!game.client) return

      Matter.Body.setAngle(body, 0)
      Matter.Body.setAngularVelocity(body, 0)

      // TODO: Can we avoid looking this up every tick?
      const player = game.entities.find(isPlayer)
      if (!player) return

      const playerBody = player.body
      const playerHeight = player.size.height
      const playerWidth = player.size.width

      const platformHeight = body.bounds.max.y - body.bounds.min.y

      let platformShouldCollideWithNetPlayers = false

      const netPlayers = game.entities.filter(isNetPlayer)
      for (const netPlayer of netPlayers) {
        const netPlayerWithinXBoundsOfPlatform =
          netPlayer.position.x + playerWidth > body.bounds.min.x &&
          netPlayer.position.x - playerWidth < body.bounds.max.x

        const netPlayerAbovePlatform =
          netPlayer.position.y + playerHeight / 2 <
          body.position.y - platformHeight / 2 + 1 // when resting on a platform we're technically not on top of it, 1 unit fixes this.

        const netPlayerYDistance = netPlayer.position.y - body.position.y
        if (
          netPlayerAbovePlatform &&
          netPlayerYDistance > -350 &&
          netPlayerWithinXBoundsOfPlatform
        ) {
          platformShouldCollideWithNetPlayers = true
          break
        }
      }

      const inputs = game.client?.inputs
      const isCrouching = inputs?.getInput('@player/crouch') ?? false

      const playerAbovePlatform =
        playerBody.position.y + playerHeight / 2 <
        body.position.y - platformHeight / 2 + 1 // when resting on a platform we're technically not on top of it, 1 unit fixes this.

      if (isPlatformActive) {
        if (isCrouching) {
          isPlatformActive = false
        }

        if (!playerAbovePlatform) {
          isPlatformActive = false
        }
      } else if (!isCrouching) {
        const playerMovingDownward = playerBody.velocity.y > 0

        isPlatformActive = playerAbovePlatform && playerMovingDownward
      }

      // by default, don't collide with netplayers on active platforms
      let activePlatformMask = 0b11111111111111111111111111111011
      let inactivePlatformMask = 0
      if (platformShouldCollideWithNetPlayers) {
        activePlatformMask = 0b11111111111111111111111111111111
        inactivePlatformMask = 0b100
      }

      body.collisionFilter.mask = isPlatformActive
        ? 0b11111111111111111111111111111111 & activePlatformMask
        : 0b11111111111111111111111111111001 | inactivePlatformMask
    },

    onRenderFrame({ smooth }, { debug }, { camera, container, gfx }) {
      const smoothed = Vec.add(body.position, Vec.mult(body.velocity, smooth))
      const pos = Vec.add(smoothed, camera.offset)

      container.position = pos
      container.rotation = body.angle
      /*

      const activeAlpha = 1
      const inactiveAlpha = 0.5

      const platformAlpha = isPlatformActive ? activeAlpha : inactiveAlpha
      gfxBounds.alpha = platformAlpha

      if (sprite) {
        sprite.alpha = platformAlpha
      }

      */
      const platformAlpha = isPlatformActive ? 1 : 0.1
      gfx.alpha = debug.value ? platformAlpha : 0
    },
  }
})
