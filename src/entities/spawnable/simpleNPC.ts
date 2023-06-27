import Matter from 'matter-js'
import type { Body, Engine } from 'matter-js'
import { Graphics } from 'pixi.js'
import type { Sprite } from 'pixi.js'
import type { Camera } from '~/entities/camera.js'
import { Vec } from '~/math/vector.js'
import { createSpawnableEntity } from '~/spawnable/spawnableEntity.js'
import type {
  PartializeSpawnable,
  SpawnableEntity,
} from '~/spawnable/spawnableEntity.js'
import { createSprite } from '~/textures/sprites.js'
import type { SpriteSource } from '~/textures/sprites.js'
import type { Debug } from '~/utils/debug.js'
import { drawBox } from '~/utils/draw.js'

interface Data {
  debug: Debug
  physics: Engine

  body: Body
}

interface Render {
  camera: Camera

  gfxBounds: Graphics
  gfxSensorL: Graphics
  gfxSensorR: Graphics

  sprite: Sprite | undefined
}

interface SimpleNPC extends SpawnableEntity<Data, Render> {}

export const createSimpleNPC = createSpawnableEntity<
  [size: number, spriteSource?: SpriteSource],
  SimpleNPC,
  Data,
  Render
>(
  'createSimpleNPC',
  ({ transform, zIndex, tags, preview }, size, spriteSource) => {
    const { position } = transform

    const mass = 20
    const sensorSize = 4
    const moveForce = 0.01
    const maxSpeed = 0.2

    let collidingL = false
    let collidingR = false
    let currentDirection: 'left' | 'right' = 'right'

    const body = Matter.Bodies.rectangle(position.x, position.y, size, size, {
      label: 'simpleNPC',
      render: { visible: false },

      inertia: Number.POSITIVE_INFINITY,
      inverseInertia: 0,
      mass,
      inverseMass: 1 / mass,
      friction: 0,

      // TODO
      // collisionFilter: {
      //   category: 0b100,
      //   mask: -1 & ~playerLayer,
      // },
    })

    const getSensorL = () =>
      Matter.Bodies.rectangle(
        body.position.x - size / 2 + sensorSize / 2,
        body.position.y,
        sensorSize,
        size - sensorSize,
      )

    const getSensorR = () =>
      Matter.Bodies.rectangle(
        body.position.x + size / 2 - sensorSize / 2,
        body.position.y,
        sensorSize,
        size - sensorSize,
      )

    const npc: PartializeSpawnable<SimpleNPC, Data, Render> = {
      get transform() {
        return { position: Vec.clone(body.position), rotation: 0 }
      },

      get tags() {
        return tags
      },

      isInBounds(position) {
        return Matter.Query.point([body], position).length > 0
      },

      init({ game, physics }) {
        Matter.Composite.add(physics.world, body)
        return { debug: game.debug, physics, body }
      },

      initRenderContext(_, { camera, stage }) {
        const gfxBounds = new Graphics()
        drawBox(gfxBounds, { width: size, height: size }, { stroke: '#00f' })

        const gfxSensorL = new Graphics()
        const gfxSensorR = new Graphics()

        gfxBounds.zIndex = zIndex + 1
        gfxSensorL.zIndex = zIndex + 2
        gfxSensorR.zIndex = zIndex + 2

        const sprite = spriteSource
          ? createSprite(spriteSource, { width: size, height: size, zIndex })
          : undefined

        stage.addChild(gfxBounds)
        stage.addChild(gfxSensorL)
        stage.addChild(gfxSensorR)
        if (sprite) stage.addChild(sprite)

        return { camera, gfxBounds, gfxSensorL, gfxSensorR, sprite }
      },

      teardown({ physics, body }) {
        Matter.Composite.remove(physics.world, body)
      },

      teardownRenderContext({ gfxBounds, gfxSensorL, gfxSensorR, sprite }) {
        gfxBounds.removeFromParent()
        gfxSensorL.removeFromParent()
        gfxSensorR.removeFromParent()
        sprite?.removeFromParent()

        gfxBounds.destroy()
        gfxSensorL.destroy()
        gfxSensorR.destroy()
        sprite?.destroy()
      },

      onPhysicsStep(_, { physics }) {
        if (preview) return

        const bodies = physics.world.bodies
          .filter(x => x !== body)
          .filter(x => !x.isSensor)
          .filter(x =>
            Matter.Detector.canCollide(body.collisionFilter, x.collisionFilter),
          )

        const queryL = Matter.Query.region(bodies, getSensorL().bounds)
        collidingL = queryL.length > 0
        const queryR = Matter.Query.region(bodies, getSensorR().bounds)
        collidingR = queryR.length > 0

        if (collidingL) currentDirection = 'right'
        else if (collidingR) currentDirection = 'left'

        const direction = currentDirection === 'left' ? -1 : 1
        const targetVelocity = maxSpeed * direction

        const velocityVector = targetVelocity / body.velocity.x
        const forcePercent = Math.min(Math.abs(velocityVector) / 2, 1)
        const newForce = moveForce * forcePercent * direction

        Matter.Body.applyForce(body, body.position, Vec.create(newForce, 0))
      },

      onRenderFrame(
        _,
        { debug },
        { camera, gfxBounds, gfxSensorL, gfxSensorR, sprite },
      ) {
        const pos = Vec.add(body.position, camera.offset)
        if (sprite) sprite.position = pos

        const sensorL = getSensorL()
        const sensorR = getSensorR()

        gfxBounds.position = pos
        gfxSensorL.position = Vec.add(sensorL.position, camera.offset)
        gfxSensorR.position = Vec.add(sensorR.position, camera.offset)

        const alpha = debug.value ? 0.5 : 0
        gfxBounds.alpha = alpha
        gfxSensorL.alpha = alpha
        gfxSensorR.alpha = alpha

        const inactive = '#f00'
        const active = '#0f0'

        const sensorLcolor = collidingL ? active : inactive
        drawBox(
          gfxSensorL,
          {
            width: sensorSize,
            height: size - sensorSize,
          },
          { fill: sensorLcolor, fillAlpha: 1, strokeAlpha: 0 },
        )

        const sensorRcolor = collidingR ? active : inactive
        drawBox(
          gfxSensorR,
          {
            width: sensorSize,
            height: size - sensorSize,
          },
          { fill: sensorRcolor, fillAlpha: 1, strokeAlpha: 0 },
        )
      },
    }

    return npc
  },
)
