import EventEmitter from 'eventemitter3'
import type { LiteralUnion } from 'type-fest'
import { inputCodes, InputCodeSchema } from './keycode.js'
import type { InputCode, MouseButton } from './keycode.js'

class CountMap<K> {
  private readonly _map: Map<K, number> = new Map()

  public increment(key: K): number {
    const count = (this._map.get(key) ?? 0) + 1
    this._map.set(key, count)

    return count
  }

  public decrement(key: K): number {
    const count = (this._map.get(key) ?? 0) - 1
    if (count > 0) this._map.set(key, count)
    else this._map.delete(key)

    return Math.max(count, 0)
  }

  public has(key: K): boolean {
    const count = this._map.get(key) ?? 0
    return count > 0
  }

  public count(key: K): number {
    return this._map.get(key) ?? 0
  }
}

type Unregister = (this: unknown) => void
type KeyOrInput = LiteralUnion<InputCode, string>
type InputEvents = Record<KeyOrInput, [pressed: boolean]>

function onKey(this: InputManager, ev: KeyboardEvent, pressed: boolean): void {
  const result = InputCodeSchema.safeParse(ev.code)
  if (!result.success) return

  // ev.preventDefault()
  this.setKey(result.data, pressed)
}

function onMouse(this: InputManager, ev: MouseEvent, pressed: boolean): void {
  const mouseButton: MouseButton | undefined =
    ev.button === 0
      ? 'MouseLeft'
      : ev.button === 1
      ? 'MouseMiddle'
      : ev.button === 2
      ? 'MouseRight'
      : undefined

  if (!mouseButton) throw new Error(`unexpected mouse button: ${ev.button}`)
  this.setKey(mouseButton, pressed)
}

export class InputManager extends EventEmitter<InputEvents> {
  private readonly keys = new Set<InputCode>()
  private readonly held = new Set<InputCode>()

  private readonly inputs = new Map<string, InputCode>()
  private readonly bindings = new Map<InputCode, string>()

  private readonly inputMap = new Map<string, Set<InputCode>>()
  private readonly reverseInputMap = new Map<InputCode, string>()

  private readonly inputCount = new CountMap<string>()

  public constructor(private readonly canvas: HTMLCanvasElement) {
    super()
  }

  public registerListeners(): Unregister {
    const boundOnKey = onKey.bind(this)
    const boundOnMouse = onMouse.bind(this)

    const onKeyDown = (ev: KeyboardEvent) => boundOnKey(ev, true)
    const onKeyUp = (ev: KeyboardEvent) => boundOnKey(ev, false)
    const onMouseDown = (ev: MouseEvent) => boundOnMouse(ev, true)
    const onMouseUp = (ev: MouseEvent) => boundOnMouse(ev, false)

    window.addEventListener('keydown', onKeyDown)
    window.addEventListener('keyup', onKeyUp)
    this.canvas.addEventListener('mousedown', onMouseDown)
    this.canvas.addEventListener('mouseup', onMouseUp)

    const unregister: Unregister = () => {
      window.removeEventListener('keydown', onKeyDown)
      window.removeEventListener('keyup', onKeyUp)
      this.canvas.removeEventListener('mousedown', onMouseDown)
      this.canvas.removeEventListener('mouseup', onMouseUp)
    }

    return unregister
  }

  // #region Key Access
  public getKey(key: InputCode): boolean {
    return this.keys.has(key)
  }

  public setKey(key: InputCode, pressed: boolean): void {
    if (pressed) this.keys.add(key)
    else this.keys.delete(key)

    this.fireEvents(key)
  }
  // #endregion

  // #region Input Mapping
  private updateInputs(): void {
    this.inputMap.clear()
    this.reverseInputMap.clear()

    const defaultKeyBindings = new Map<InputCode, string>()
    for (const [input, defaultKey] of this.inputs.entries()) {
      defaultKeyBindings.set(defaultKey, input)
    }

    for (const key of inputCodes) {
      const input = this.bindings.get(key) ?? defaultKeyBindings.get(key)
      if (!input) continue

      const set = this.inputMap.get(input) ?? new Set()
      set.add(key)

      this.inputMap.set(input, set)
      this.reverseInputMap.set(key, input)
    }
  }

  public registerInput(name: string, defaultKey: InputCode): void {
    // @ts-expect-error String Union
    if (inputCodes.includes(name)) {
      throw new Error('input name cannot be a key code')
    }

    this.inputs.set(name, defaultKey)
    this.updateInputs()
  }

  public bindInput(key: InputCode, input: string | undefined): void {
    if (input) this.bindings.set(key, input)
    else this.bindings.delete(key)

    this.updateInputs()
  }
  // #endregion

  // #region Input Access
  public getInput(input: string): boolean | undefined {
    const keys = this.inputMap.get(input)
    if (!keys || keys.size === 0) return undefined

    return [...keys].some(key => this.getKey(key))
  }
  // #endregion

  private fireEvents(key: InputCode): void {
    // Check for being held
    const wasPressed = this.held.has(key)
    const isPressed = this.getKey(key)
    if (wasPressed === isPressed) return

    // Update held state
    if (isPressed) this.held.add(key)
    else this.held.delete(key)

    this.emit(key, isPressed)

    // Check if this key is mapped to an input
    const input = this.reverseInputMap.get(key)
    if (!input) return

    // Update internal state
    const prevCount = this.inputCount.count(input)
    if (isPressed) this.inputCount.increment(input)
    else this.inputCount.decrement(input)

    // Emit if needed
    const count = this.inputCount.count(input)
    if (prevCount === 0 && count === 1) this.emit(input, true)
    else if (count === 0) this.emit(input, false)
  }
}
