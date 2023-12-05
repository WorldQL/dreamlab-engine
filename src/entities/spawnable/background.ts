import type { Sprite } from 'pixi.js'
import { Container, Graphics } from 'pixi.js'
import { z } from 'zod'
import type { SpawnableEntity } from '~/exports'
import { createSpawnableEntity } from '~/exports'
import type { Game } from '~/game'
import { cloneTransform } from '~/math/transform'
import { Vec } from '~/math/vector'
import { createSprite } from '~/textures/sprites'
import { drawBox } from '~/utils/draw'
import type { Camera } from '../camera'

type Args = typeof ArgsSchema
const ArgsSchema = z.object({
  width: z.number().positive().min(1),
  height: z.number().positive().min(1),
  textureURL: z.string(),
  parallaxX: z.number(),
  parallaxY: z.number(),
})

interface Data {
  game: Game<boolean>
}

interface Render {
  camera: Camera
  container: Container
  graphics: Graphics
  sprite: Sprite
}

export const createBackground = createSpawnableEntity<
  Args,
  SpawnableEntity<Data, Render, Args>,
  Data,
  Render
>(
  ArgsSchema,
  (
    { tags, transform },
    { width, height, textureURL, parallaxX, parallaxY },
  ) => {
    const { position, zIndex } = transform

    return {
      get position() {
        return Vec.create(position.x, position.y)
      },

      get tags() {
        return tags
      },

      get transform() {
        return cloneTransform(transform)
      },

      rectangleBounds() {
        return undefined
      },

      isPointInside() {
        return false
      },

      init({ game }) {
        return { game }
      },

      initRenderContext(_, { camera, stage }) {
        const container = new Container()
        container.sortableChildren = true
        container.zIndex = zIndex
        const graphics = new Graphics()
        graphics.zIndex = zIndex
        const sprite = createSprite(textureURL, {
          width,
          height,
          zIndex,
        })

        if (sprite) {
          container.addChild(sprite)
        } else {
          drawBox(graphics, { width, height }, { stroke: '#00f' })
          container.addChild(graphics)
        }

        stage.addChild(container)
        return {
          camera,
          container,
          graphics,
          sprite,
        }
      },

      teardown(_) {
        // No-op
      },

      teardownRenderContext({ container }) {
        container.destroy({ children: true })
      },

      onPhysicsStep() {},

      onRenderFrame(_, { game }, { camera, container, graphics }) {
        const debug = game.debug
        if (!game.client) {
          throw new Error('game.client is undefined')
        }

        const DEFAULT_SCALE = 1
        const targetW = game.client?.render.container.clientWidth
        const targetH = game.client?.render.container.clientHeight

        const zoomScale = camera.zoomScale
        const cameraOffset = camera.offset

        const offsetXAtDefaultZoom =
          targetW / DEFAULT_SCALE / 2 - cameraOffset.x
        const offsetXAtCurrentZoom = targetW / zoomScale / 2 - cameraOffset.x
        const offsetXDifference = offsetXAtCurrentZoom - offsetXAtDefaultZoom

        const offsetYAtDefaultZoom =
          targetH / DEFAULT_SCALE / 2 - cameraOffset.y
        const offsetYAtCurrentZoom = targetH / zoomScale / 2 - cameraOffset.y
        const offsetYDifference = offsetYAtCurrentZoom - offsetYAtDefaultZoom

        const parallaxPos = Vec.create(
          position.x +
            cameraOffset.x * parallaxX +
            offsetXDifference * (1 - parallaxX),
          position.y +
            cameraOffset.y * parallaxY +
            offsetYDifference * (1 - parallaxY),
        )
        const scalingFactor = Math.max(2, 0.25)
        container.scale.set(scalingFactor, scalingFactor)

        container.position = parallaxPos

        const alpha = debug.value ? 0.5 : 0
        graphics.alpha = alpha
      },
    }
  },
)
