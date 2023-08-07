import EventEmitter from 'eventemitter3'
import { KeyCodeSchema } from './keycode.js'
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
type Events = Record<KeyCode, [pressed: boolean]>

function onKey(this: InputManager, ev: KeyboardEvent, pressed: boolean): void {
  const result = KeyCodeSchema.safeParse(ev.code)
  if (!result.success) return

  ev.preventDefault()
  this.setKey(result.data, pressed)
}

export class InputManager extends EventEmitter<Events> {
  private readonly keys = new CountMap<KeyCode>()
  private readonly held = new Set<KeyCode>()
  // private readonly bindings = new Map<KeyCode, string>()

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

  // TODO: Allow binding keys to aliases and support remapping
  // public registerInput(name: string, defaultKey: KeyCode): void {
  //   this.bindings.set(defaultKey, name)
  // }

  // public getInputKeys(name: string): KeyCode[] {
  //   // TODO: Maybe optimise this
  //   return [...this.bindings.entries()]
  //     .filter(([_, input]) => input === name)
  //     .map(([key]) => key)
  // }

  // public getInput(input: string): boolean | undefined {
  //   const keys =
  // }

  public getKey(key: KeyCode): boolean {
    return this.keys.has(key)
  }

  public setKey(key: KeyCode, pressed: boolean): void {
    if (pressed) this.keys.increment(key)
    else this.keys.decrement(key)

    this.fireEvent(key)
  }

  private fireEvent(key: KeyCode): void {
    // Check for being held
    const wasPressed = this.held.has(key)
    const isPressed = this.getKey(key)
    if (wasPressed === isPressed) return

    // Update held state
    if (isPressed) this.held.add(key)
    else this.held.delete(key)

    this.emit(key, isPressed)
  }
}
