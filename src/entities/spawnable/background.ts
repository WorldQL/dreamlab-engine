import { Graphics } from 'pixi.js'
import { z } from 'zod'
import type { Camera } from '~/entities/camera.js'
import { simpleBoundsTest } from '~/math/bounds.js'
import { Vec } from '~/math/vector.js'
import { createSpawnableEntity } from '~/spawnable/spawnableEntity.js'
import type { SpawnableEntity } from '~/spawnable/spawnableEntity.js'
import type { Debug } from '~/utils/debug.js'
import { drawBox } from '~/utils/draw.js'

type Args = typeof ArgsSchema
const ArgsSchema = z.object({})

interface Data {
  debug: Debug
}

interface Render {
  camera: Camera
}

const symbol = Symbol.for('@dreamlab/core/background')
export interface Background extends SpawnableEntity<Data, Render, Args> {
  [symbol]: true
}

export const isBackground = (entity: SpawnableEntity): entity is Background => {
  return symbol in entity && entity[symbol] === true
}

export const createBackground = createSpawnableEntity<
  Args,
  Background,
  Data,
  Render
>(ArgsSchema, ({ tags }) => ({
  get [symbol]() {
    return true as const
  },

  get tags() {
    return [...tags]
  },

  rectangleBounds() {
    return undefined
  },

  isPointInside(_position) {
    return false
  },

  init({ game }) {
    return { debug: game.debug }
  },

  initRenderContext(_, { camera }) {
    // TODO
    return { camera }
  },

  teardown(_) {
    // No-op
  },

  teardownRenderContext({ camera }) {
    // TODO
  },

  onRenderFrame(time, data, render) {
    // TODO
  },
}))
