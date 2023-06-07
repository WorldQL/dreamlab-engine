import { EventEmitter } from 'eventemitter3'
import { translateMap } from '~/input/inputMap.js'
import type { InputMap } from '~/input/inputMap.js'
import type { KeyCode } from '~/input/keycode.js'

export type Input<I extends readonly string[]> = I[number]
export type InputDescriptions<I extends readonly string[]> = Record<
  Input<I>,
  string
>

type Events<I extends readonly string[]> = Record<
  Input<I>,
  [pressed: boolean]
> & {
  input: [input: Input<I>, pressed: boolean]
  pressed: [input: Input<I>]
}

type Unregister = (this: unknown) => void

export class InputEmitter<
  const I extends readonly string[],
> extends EventEmitter<Events<I>> {
  private readonly state: Map<Input<I>, boolean>

  public constructor(inputs: I) {
    super()
    this.state = new Map<Input<I>, boolean>(inputs.map(x => [x, false]))
  }

  public getInput(key: Input<I>): boolean {
    return this.state.get(key) ?? false
  }

  public get entries(): readonly [input: Input<I>, pressed: boolean][] {
    return [...this.state.entries()]
  }

  public registerListeners(inputMap: InputMap<I>): Unregister {
    const keyMap = translateMap(inputMap)

    const onKey = (ev: KeyboardEvent, pressed: boolean) => {
      const code = ev.code as KeyCode
      const input = keyMap.get(code)
      if (!input) return

      ev.preventDefault()
      this.fire(input, pressed)
    }

    const onKeyDown = (ev: KeyboardEvent) => onKey(ev, true)
    const onKeyUp = (ev: KeyboardEvent) => onKey(ev, false)

    window.addEventListener('keydown', onKeyDown)
    window.addEventListener('keyup', onKeyUp)

    const unregister: Unregister = () => {
      window.removeEventListener('keydown', onKeyDown)
      window.removeEventListener('keyup', onKeyUp)
    }

    return unregister
  }

  public fire(input: Input<I>, pressed: boolean): void {
    const state = this.state.get(input) ?? false

    if (state === pressed) return
    this.state.set(input, pressed)

    // @ts-expect-error Complex Types
    this.emit(input, pressed)
    // @ts-expect-error Complex Types
    this.emit('input', input, pressed)

    // @ts-expect-error Complex Types
    if (pressed === false) this.emit('pressed', input)
  }
}

export interface RequiredInputs<I extends string> {
  getInput(input: I): boolean

  addListener(input: I, fn: (pressed: boolean) => void): void
  removeListener(input: I, fn: (pressed: boolean) => void): void
}
