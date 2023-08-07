import EventEmitter from 'eventemitter3'
import type { LiteralUnion } from 'type-fest'
import { keyCodes, KeyCodeSchema } from './keycode.js'
import type { KeyCode } from './keycode.js'

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
type KeyEvents = Record<LiteralUnion<KeyCode, string>, [pressed: boolean]>

function onKey(this: InputManager, ev: KeyboardEvent, pressed: boolean): void {
  const result = KeyCodeSchema.safeParse(ev.code)
  if (!result.success) return

  // ev.preventDefault()
  this.setKey(result.data, pressed)
}

export class InputManager extends EventEmitter<KeyEvents> {
  private readonly keys = new Set<KeyCode>()
  private readonly held = new Set<KeyCode>()

  private readonly inputs = new Map<string, KeyCode>()
  private readonly bindings = new Map<KeyCode, string>()

  private readonly inputMap = new Map<string, Set<KeyCode>>()
  private readonly reverseInputMap = new Map<KeyCode, string>()

  private readonly inputCount = new CountMap<string>()

  public constructor() {
    super()
  }

  public registerListeners(): Unregister {
    const boundOnKey = onKey.bind(this)

    const onKeyDown = (ev: KeyboardEvent) => boundOnKey(ev, true)
    const onKeyUp = (ev: KeyboardEvent) => boundOnKey(ev, false)

    window.addEventListener('keydown', onKeyDown)
    window.addEventListener('keyup', onKeyUp)

    const unregister: Unregister = () => {
      window.removeEventListener('keydown', onKeyDown)
      window.removeEventListener('keyup', onKeyUp)
    }

    return unregister
  }

  // #region Key Access
  public getKey(key: KeyCode): boolean {
    return this.keys.has(key)
  }

  public setKey(key: KeyCode, pressed: boolean): void {
    if (pressed) this.keys.add(key)
    else this.keys.delete(key)

    this.fireEvents(key)
  }
  // #endregion

  // #region Input Mapping
  private updateInputs(): void {
    this.inputMap.clear()
    this.reverseInputMap.clear()

    const defaultKeyBindings = new Map<KeyCode, string>()
    for (const [input, defaultKey] of this.inputs.entries()) {
      defaultKeyBindings.set(defaultKey, input)
    }

    for (const key of keyCodes) {
      const input = this.bindings.get(key) ?? defaultKeyBindings.get(key)
      if (!input) continue

      const set = this.inputMap.get(input) ?? new Set()
      set.add(key)

      this.inputMap.set(input, set)
      this.reverseInputMap.set(key, input)
    }
  }

  public registerInput(name: string, defaultKey: KeyCode): void {
    // @ts-expect-error String Union
    if (keyCodes.includes(name)) {
      throw new Error('input name cannot be a key code')
    }

    this.inputs.set(name, defaultKey)
    this.updateInputs()
  }

  public bindInput(key: KeyCode, input: string | undefined): void {
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

  private fireEvents(key: KeyCode): void {
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
