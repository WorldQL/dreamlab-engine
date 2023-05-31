import { z } from 'zod'
import type { Input } from '~/input/emitter.js'
import { KeyCodeSchema } from '~/input/keycode.js'
import type { KeyCode } from '~/input/keycode.js'

export type InputDefinition = z.infer<typeof InputDefinitionSchema>
export const InputDefinitionSchema = z.object({
  primary: KeyCodeSchema,
  secondary: KeyCodeSchema.optional(),
})

export type InputMap<I extends readonly string[]> = Record<
  Input<I>,
  InputDefinition
>

type KeyMap<I extends readonly string[]> = Map<KeyCode, Input<I>>
export const translateMap = <const I extends readonly string[]>(
  inputMap: InputMap<I>,
): KeyMap<I> => {
  const map: KeyMap<I> = new Map()
  const entries = Object.entries(inputMap) as [Input<I>, InputDefinition][]

  for (const [input, { primary, secondary }] of entries) {
    map.set(primary, input as Input<I>)
    if (secondary) map.set(secondary, input as Input<I>)
  }

  return map
}
