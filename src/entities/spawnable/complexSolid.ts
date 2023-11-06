import Matter from 'matter-js'
import type { Body } from 'matter-js'
import { Graphics } from 'pixi.js'
import { z } from 'zod'
import type { Camera } from '~/entities/camera.js'
import { dataManager } from '~/entity.js'
import { toRadians } from '~/math/general.js'
import { decodePolygons, pointsBounds } from '~/math/polygons.js'
import type { PositionListener, RotationListener } from '~/math/transform.js'
import { Vec, VectorSchema } from '~/math/vector.js'
import type { Vector } from '~/math/vector.js'
import type { Physics } from '~/physics.js'
import { createSpawnableEntity } from '~/spawnable/spawnableEntity.js'
import type { SpawnableEntity } from '~/spawnable/spawnableEntity.js'
import type { Debug } from '~/utils/debug.js'
import { drawComplexPolygon } from '~/utils/draw.js'

const ArgsSchema = z.object({
  polygon: VectorSchema.array().array().or(z.string()),
})

interface Data {
  debug: Debug
  physics: Physics
  onPositionChanged: PositionListener
  onRotationChanged: RotationListener

  polygons: Vector[][]
  bodies: Body[]
}

interface Render {
  camera: Camera
  gfx: Graphics
}

export const createComplexSolid = createSpawnableEntity<
  typeof ArgsSchema,
  SpawnableEntity<Data, Render>,
  Data,
  Render
>(ArgsSchema, ({ transform, zIndex, tags, preview }, { polygon: poly }) => {
  const polygons = typeof poly === 'string' ? decodePolygons(poly) : poly
  const bounds = pointsBounds(polygons)

  return {
    get tags() {
      return tags
    },

    rectangleBounds() {
      return bounds
    },

    isPointInside(position) {
      const { bodies } = dataManager.getData(this)
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

      const onPositionChanged: PositionListener = (component, _, delta) => {
        const vector =
          component === 'x' ? { x: delta, y: 0 } : { x: 0, y: delta }
        for (const body of bodies) {
          Matter.Body.setPosition(body, Vec.add(body.position, vector))
        }
      }

      const onRotationChanged: RotationListener = (_, delta) => {
        Matter.Composite.rotate(composite, toRadians(delta), transform.position)
      }

      physics.register(this, ...bodies)
      transform.addPositionListener(onPositionChanged)
      transform.addRotationListener(onRotationChanged)

      return {
        debug,
        physics,
        onPositionChanged,
        onRotationChanged,
        polygons,
        bodies,
      }
    },

    initRenderContext(_, { stage, camera }) {
      const { polygons } = dataManager.getData(this)

      const gfx = new Graphics()
      gfx.zIndex = zIndex + 1

      drawComplexPolygon(gfx, polygons)
      stage.addChild(gfx)

      return { camera, gfx }
    },

    teardown({ physics, onPositionChanged, onRotationChanged, bodies }) {
      physics.unregister(this, ...bodies)
      transform.removeListener(onPositionChanged)
      transform.removeListener(onRotationChanged)
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
