import { Bodies, Composite, Query, Vertices } from 'matter-js'
import type { Body, Engine } from 'matter-js'
import { Graphics } from 'pixi.js'
import type { Camera } from '~/entities/camera'
import { dataManager } from '~/entity.js'
import { cloneTransform } from '~/math/transform.js'
import { Vector } from '~/math/vector.js'
import { createSpawnableEntity } from '~/spawnable/spawnableEntity.js'
import type { SpawnableEntity } from '~/spawnable/spawnableEntity.js'
import type { Debug } from '~/utils/debug.js'
import { drawComplexPolygon } from '~/utils/draw.js'
import { decodePolygons } from '~/utils/polygons.js'

interface Data {
  debug: Debug
  physics: Engine

  polygons: Vector[][]
  bodies: Body[]
}

interface Render {
  camera: Camera
  gfx: Graphics
}

type Args = [points: Vector[][] | string]

export const createComplexSolid = createSpawnableEntity<
  Args,
  SpawnableEntity<Data, Render>,
  Data,
  Render
>('createComplexSolid', ({ transform, zIndex, tags, preview }, poly) => ({
  get transform() {
    return cloneTransform(transform)
  },

  get tags() {
    return tags
  },

  isInBounds(position) {
    const { bodies } = dataManager.getData(this)
    return Query.point(bodies, position).length > 0
  },

  init({ game, physics }) {
    const debug = game.debug

    const polygons = typeof poly === 'string' ? decodePolygons(poly) : poly
    const bodies = polygons.map(points => {
      const { x, y } = Vector.add(transform.position, Vertices.centre(points))
      return Bodies.fromVertices(x, y, [points], {
        label: 'complexSolid',
        render: { visible: false },

        isStatic: true,
        isSensor: preview,
        friction: 0,
      })
    })

    Composite.add(physics.world, bodies)
    return { debug, physics, polygons, bodies }
  },

  initRenderContext(_, { stage, camera }) {
    const { polygons } = dataManager.getData(this)

    const gfx = new Graphics()
    gfx.zIndex = zIndex + 1

    drawComplexPolygon(gfx, polygons)
    stage.addChild(gfx)

    return { camera, gfx }
  },

  teardown({ physics, bodies }) {
    Composite.remove(physics.world, bodies)
  },

  teardownRenderContext({ gfx }) {
    gfx.removeFromParent()
    gfx.destroy()
  },

  onRenderFrame(_, { debug }, { camera, gfx }) {
    const pos = Vector.add(transform.position, camera.offset)

    gfx.position = pos
    gfx.alpha = debug.value ? 0.5 : 0
  },
}))
