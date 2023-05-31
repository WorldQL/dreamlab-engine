import { createEntity } from '~/entity.js'
import type { InputEmitter } from '~/input/emitter.js'
import type { InputMap } from '~/input/inputMap.js'

export const createInputs = <const I extends string[]>(
  inputs: InputEmitter<I>,
  inputMap: InputMap<I>,
) =>
  createEntity({
    init(_) {
      // No-op
    },

    initRenderContext(_) {
      const unregister = inputs.registerListeners(inputMap)
      return { unregister }
    },

    teardown(_) {
      // No-op
    },

    teardownRenderContext({ unregister }) {
      unregister()
    },
  })
