import Matter from 'matter-js'
import { Container, Graphics } from 'pixi.js'
import type { Sprite } from 'pixi.js'
import { z } from 'zod'
import type { Camera } from '~/entities/camera.js'
import type { Game } from '~/game'
import { toRadians } from '~/math/general'
import { cloneTransform } from '~/math/transform'
import { Vec } from '~/math/vector.js'
import type { SpawnableEntity } from '~/spawnable/spawnableEntity.js'
import { createSpawnableEntity } from '~/spawnable/spawnableEntity.js'
import { createSprite, SpriteSourceSchema } from '~/textures/sprites.js'
import { drawBox } from '~/utils/draw.js'
import { isNetPlayer } from '../netplayer'
import { isPlayer } from '../player'

type Args = typeof ArgsSchema
const ArgsSchema = z.object({
  width: z.number().positive().min(1).default(100),
  height: z.number().positive().min(1).default(100),
  spriteSource: SpriteSourceSchema.optional(),
})

interface Data {
  game: Game<boolean>
  body: Matter.Body
}

interface Render {
  camera: Camera
  stage: Container
  gfx: Graphics
  sprite: Sprite | undefined
}

export const createPlatform = createSpawnableEntity<
  Args,
  SpawnableEntity<Data, Render, Args>,
  Data,
  Render
>(ArgsSchema, ({ tags, transform }, args) => {
  const { position, zIndex } = transform

  const body = Matter.Bodies.rectangle(
    position.x,
    position.y,
    args.width,
    args.height,
    {
      label: 'platform',
      render: { visible: true },
      isStatic: true,
      friction: 0,
    },
  )

  let isPlatformActive = false

  return {
    get tags() {
      return tags
    },

    get transform() {
      return cloneTransform(transform)
    },

    rectangleBounds() {
      return { width: args.width, height: args.height }
    },

    isPointInside(position) {
      return Matter.Query.point([body], position).length > 0
    },

    onArgsUpdate(path, _previous, _data, render) {
      if (render && path === 'spriteSource') {
        const { width, height, spriteSource } = args

        render.sprite?.destroy()
        render.sprite = spriteSource
          ? createSprite(spriteSource, {
              width,
              height,
              zIndex: transform.zIndex,
            })
          : undefined

        if (render.sprite) render.stage.addChild(render.sprite)
      }

      if (path === 'width' || path === 'height') {
        const { width: originalWidth, height: originalHeight } = _previous
        const { width, height } = args

        const scaleX = width / originalWidth
        const scaleY = height / originalHeight

        Matter.Body.setAngle(_data.body, 0)
        Matter.Body.scale(_data.body, scaleX, scaleY)
        Matter.Body.setAngle(body, toRadians(transform.rotation))

        if (render) {
          drawBox(render.gfx, { width, height })
          if (render.sprite) {
            render.sprite.width = width
            render.sprite.height = height
          }
        }
      }
    },

    onResize({ width, height }) {
      args.width = width
      args.height = height
    },

    init({ game, physics }) {
      game.physics.register(this, body)
      physics.linkTransform(body, transform)

      return { game, body }
    },

    initRenderContext(_, { camera, stage }) {
      const container = new Container()
      container.sortableChildren = true
      container.zIndex = zIndex
      const gfxBounds = new Graphics()
      gfxBounds.zIndex = zIndex
      const sprite = args.spriteSource
        ? createSprite(args.spriteSource, {
            width: args.width,
            height: args.height,
            zIndex,
          })
        : undefined

      if (sprite) {
        container.addChild(sprite)
      } else {
        drawBox(gfxBounds, { width: args.width, height: args.height })
        container.addChild(gfxBounds)
      }

      stage.addChild(container)

      return {
        camera,
        stage: container,
        gfx: gfxBounds,
        sprite,
      }
    },

    teardown({ game }) {
      game.physics.unregister(this, body)
    },

    teardownRenderContext({ stage: container }) {
      container.destroy({ children: true })
    },

    onPhysicsStep(_, { game }) {
      if (!game.client) {
        return
      }

      Matter.Body.setAngle(body, 0)
      Matter.Body.setAngularVelocity(body, 0)

      // TODO: Can we avoid looking this up every tick?
      const player = game.entities.find(isPlayer)
      const playerBody = player?.body
      const playerHeight = player?.size.height
      if (!playerHeight) {
        return
      }

      if (!playerBody) return

      let platformShouldCollideWithNetPlayers = false

      const netPlayers = game.entities.filter(isNetPlayer)
      for (const netPlayer of netPlayers) {
        const netPlayerAbovePlatform =
          netPlayer.position.y + playerHeight / 2 <
          (body.position.y + body.bounds.min.y) / 2
        const netPlayerYDistance = netPlayer.position.y - body.position.y
        if (netPlayerAbovePlatform && netPlayerYDistance > -500) {
          platformShouldCollideWithNetPlayers = true
          break
        }
      }

      const playerOnX =
        playerBody.position.x > body.bounds.min.x &&
        playerBody.position.x < body.bounds.max.x
      const playerYDistance = playerBody.position.y - body.position.y
      const inYThreshold = playerYDistance < -194 && playerYDistance > -500
      const shouldProactivelyEnable = playerOnX && inYThreshold

      const inputs = game.client?.inputs
      const isCrouching = inputs?.getInput('@player/crouch') ?? false
      if (isPlatformActive) {
        if (isCrouching) {
          isPlatformActive = false
        }

        if (
          Matter.Query.collides(body, [playerBody]).length === 0 &&
          !shouldProactivelyEnable
        ) {
          isPlatformActive = false
        }
      } else if (
        Matter.Query.collides(body, [playerBody]).length > 0 &&
        !isCrouching
      ) {
        const playerAbovePlatform =
          playerBody.position.y + playerHeight / 2 <
          (body.position.y + body.bounds.min.y) / 2

        const playerMovingDownward = playerBody.velocity.y > 0

        isPlatformActive = Boolean(playerAbovePlatform && playerMovingDownward)
      }

      if (!isPlatformActive && shouldProactivelyEnable && !isCrouching) {
        isPlatformActive = true
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

    onRenderFrame(
      { smooth },
      { game },
      { camera, stage: container, gfx: gfxBounds },
    ) {
      const debug = game.debug
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

      gfxBounds.alpha = debug.value ? platformAlpha : 0
    },
  }
})
