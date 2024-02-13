import Matter from 'matter-js'
import type { Body } from 'matter-js'
import { Graphics } from 'pixi.js'
import { z } from 'zod'
import type { Camera } from '~/entities/camera.js'
import { createSpawnableEntity, dataManager } from '~/labs/compat'
import type { LegacySpawnableEntity as SpawnableEntity } from '~/labs/compat'
import { toRadians } from '~/math/general.js'
import { decodePolygons, pointsBounds } from '~/math/polygons.js'
import { Vec, VectorSchema } from '~/math/vector.js'
import type { Physics } from '~/physics.js'
import type { Debug } from '~/utils/debug.js'
import { drawComplexPolygon } from '~/utils/draw.js'

type Args = typeof ArgsSchema
export const ArgsSchema = z.object({
  polygon: VectorSchema.array().array().or(z.string()),
})

interface Data {
  debug: Debug
  physics: Physics

  bodies: Body[]
}

interface Render {
  camera: Camera
  gfx: Graphics
}

export const createComplexSolid = createSpawnableEntity<
  Args,
  SpawnableEntity<Data, Render, Args>,
  Data,
  Render
>(ArgsSchema, ({ _this, transform, preview }, args) => {
  const polygons =
    typeof args.polygon === 'string'
      ? decodePolygons(args.polygon)
      : args.polygon

  const bounds = pointsBounds(polygons)

  return {
    rectangleBounds() {
      return bounds
    },

    isPointInside(position) {
      const { bodies } = dataManager.getData(_this)
      return Matter.Query.point(bodies, position).length > 0
    },

    init({ game, physics }) {
      const debug = game.debug

      const bodies = polygons.map(points => {
        const { x, y } = Vec.add(
          transform.position,
          Matter.Vertices.centre(points),
        )

        return Matter.Bodies.fromVertices(x, y, [points], {
          label: 'complexSolid',
          render: { visible: false },

          isStatic: true,
          isSensor: preview,
          friction: 0,
        })
      })

      const composite = Matter.Composite.create({ bodies })
      Matter.Composite.rotate(
        composite,
        toRadians(transform.rotation),
        transform.position,
      )

      transform.addPositionListener((component, _, delta) => {
        const vector =
          component === 'x' ? { x: delta, y: 0 } : { x: 0, y: delta }
        for (const body of bodies) {
          Matter.Body.setPosition(body, Vec.add(body.position, vector))
        }
      })

      transform.addRotationListener((_, delta) => {
        Matter.Composite.rotate(composite, toRadians(delta), transform.position)
      })

      // @ts-expect-error Tuple Spread
      physics.register(_this, ...bodies)

      return {
        debug,
        physics,
        bodies,
      }
    },

    initRenderContext(_, { stage, camera }) {
      const gfx = new Graphics()
      gfx.zIndex = transform.zIndex

      transform.addZIndexListener(() => {
        gfx.zIndex = transform.zIndex
      })

      drawComplexPolygon(gfx, polygons)
      stage.addChild(gfx)

      return { camera, gfx }
    },

    teardown({ physics, bodies }) {
      // @ts-expect-error Tuple Spread
      physics.unregister(_this, ...bodies)
    },

    teardownRenderContext({ gfx }) {
      gfx.destroy()
    },

    onRenderFrame(_, { debug }, { camera, gfx }) {
      const pos = Vec.add(transform.position, camera.offset)

      gfx.position = pos
      gfx.alpha = debug.value ? 0.5 : 0
      gfx.angle = transform.rotation
    },
  }
})
