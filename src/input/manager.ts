import EventEmitter from 'eventemitter3'
import type { LiteralUnion } from 'type-fest'
import type { Camera } from '~/entities/camera.js'
import type { Vector } from '~/math/vector.js'
import { CountMap } from './countmap.js'
import { inputNames } from './inputNames.js'
import { inputCodes, InputCodeSchema } from './inputcode.js'
import type { InputCode, MouseButton } from './inputcode.js'

type Unregister = (this: unknown) => void
type KeyOrInput = LiteralUnion<InputCode, string>
type InputEvents = Record<KeyOrInput, [pressed: boolean]> & {
  onRegistered: [id: string]
  onWheel: [ev: WheelEvent]
}

// Keep this in sync with any special events added above
const reserved = new Set(['onRegistered', 'onWheel'])

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

type DisabledType = 'all' | 'keyboard' | 'mouse'

export class InputManager extends EventEmitter<InputEvents> {
  private readonly canvas: HTMLCanvasElement
  private readonly camera: Camera

  private readonly keyboardDisabledBy: Set<string>
  private readonly mouseDisabledBy: Set<string>

  private readonly keys = new Set<InputCode>()
  private readonly held = new Set<InputCode>()

  private readonly inputs = new Map<
    string,
    { defaultKey: InputCode; name: string }
  >()
  private readonly bindings = new Map<InputCode, string>()

  private readonly inputMap = new Map<string, Set<InputCode>>()
  private readonly reverseInputMap = new Map<InputCode, string>()

  private readonly inputCount = new CountMap<string>()

  private mousePosition: Vector | undefined
  private cursorPosition: Vector | undefined

  public constructor(ctx: { canvas: HTMLCanvasElement; camera: Camera }) {
    super()

    this.canvas = ctx.canvas
    this.camera = ctx.camera

    this.keyboardDisabledBy = new Set()
    this.mouseDisabledBy = new Set()
  }

  public registerListeners(): Unregister {
    const boundOnKey = onKey.bind(this)
    const boundOnMouse = onMouse.bind(this)

    const onKeyDown = (ev: KeyboardEvent) => boundOnKey(ev, true)
    const onKeyUp = (ev: KeyboardEvent) => boundOnKey(ev, false)
    const onMouseDown = (ev: MouseEvent) => boundOnMouse(ev, true)
    const onMouseUp = (ev: MouseEvent) => boundOnMouse(ev, false)
    const onMouseMove = this.onMouseMove.bind(this)
    const onMouseOut = this.onMouseOut.bind(this)
    const onWheel = this.onWheel.bind(this)

    window.addEventListener('keydown', onKeyDown)
    window.addEventListener('keyup', onKeyUp)
    this.canvas.addEventListener('mousedown', onMouseDown)
    this.canvas.addEventListener('mouseup', onMouseUp)
    this.canvas.addEventListener('mouseover', onMouseMove)
    this.canvas.addEventListener('mousemove', onMouseMove)
    this.canvas.addEventListener('mouseout', onMouseOut)
    this.canvas.addEventListener('wheel', onWheel)

    const unregister: Unregister = () => {
      window.removeEventListener('keydown', onKeyDown)
      window.removeEventListener('keyup', onKeyUp)
      this.canvas.removeEventListener('mousedown', onMouseDown)
      this.canvas.removeEventListener('mouseup', onMouseUp)
      this.canvas.removeEventListener('mouseover', onMouseMove)
      this.canvas.removeEventListener('mousemove', onMouseMove)
      this.canvas.removeEventListener('mouseout', onMouseOut)
      this.canvas.removeEventListener('wheel', onWheel)
    }

    return unregister
  }

  // #region Enable / Disable
  /**
   * Get if any input types have been disabled
   */
  public get disabled(): DisabledType | undefined {
    const keyboard = this.keyboardDisabledBy.size
    const mouse = this.mouseDisabledBy.size

    if (keyboard > 0 && mouse > 0) return 'all'
    if (keyboard > 0 && mouse === 0) return 'keyboard'
    if (keyboard === 0 && mouse > 0) return 'mouse'

    return undefined
  }

  /**
   * Request the input system be enabled. A unique (enough) identifier is required
   * in case multiple contexts want to enable / disable the input system.
   *
   * @param type - Input type to disable
   * @param by - Context Identifier
   */
  public enable(type: DisabledType, by: string): void {
    if (type === 'all' || type === 'keyboard') {
      this.keyboardDisabledBy.delete(by)
    }

    if (type === 'all' || type === 'mouse') {
      this.mouseDisabledBy.delete(by)
    }
  }

  /**
   * Request the input system be disabled. A unique (enough) identifier is required
   * in case multiple contexts want to enable / disable the input system.
   *
   * @param type - Input type to disable
   * @param by - Context Identifier
   */
  public disable(type: DisabledType, by: string): void {
    if (type === 'all' || type === 'keyboard') {
      this.keyboardDisabledBy.add(by)
    }

    if (type === 'all' || type === 'mouse') {
      this.mouseDisabledBy.add(by)
    }
  }
  // #endregion

  // #region Key Access
  /**
   * Returns the human readable name of a key
   *
   * eg: `LetterA` becomes `A`, `MouseRight` becomes `RMB`
   *
   * @param key - Key Code
   */
  public getKeyName(key: InputCode): string {
    return inputNames[key] ?? key
  }

  /**
   * Get whether a key is currently pressed
   *
   * @param key - Key Code
   */
  public getKey(key: InputCode): boolean {
    const disabled = this.disabled
    const isMouse = this.isMouseInput(key)

    if ((disabled === 'all' || disabled === 'keyboard') && !isMouse) {
      return false
    }

    if ((disabled === 'all' || disabled === 'mouse') && isMouse) {
      return false
    }

    return this.keys.has(key)
  }

  /**
   * Set key pressed state
   *
   * @param key - Key Code
   * @returns
   */
  public setKey(key: InputCode, pressed: boolean): void {
    const disabled = this.disabled
    const isMouse = this.isMouseInput(key)

    if ((disabled === 'all' || disabled === 'keyboard') && !isMouse) {
      return
    }

    if ((disabled === 'all' || disabled === 'mouse') && isMouse) {
      return
    }

    if (pressed) this.keys.add(key)
    else this.keys.delete(key)

    this.fireEvents(key)
  }
  // #endregion

  // #region Input Mapping
  private updateInputs(): void {
    this.inputMap.clear()
    this.reverseInputMap.clear()

    for (const key of inputCodes) {
      const input = this.bindings.get(key)
      if (!input) continue

      const set = this.inputMap.get(input) ?? new Set()
      set.add(key)

      this.inputMap.set(input, set)
      this.reverseInputMap.set(key, input)
    }

    for (const [input, { defaultKey }] of this.inputs.entries()) {
      if (this.inputMap.has(input)) continue

      this.reverseInputMap.set(defaultKey, input)
      const set = this.inputMap.get(input) ?? new Set()
      set.add(defaultKey)
      this.inputMap.set(input, set)
    }
  }

  /**
   * Register a named input that can be rebound at runtime
   *
   * @param id - Input ID, must be unique
   * @param name - Human readable name, used in rebinding UI
   * @param defaultKey - Key used as a fallback when no keys are bound
   */
  public registerInput(id: string, name: string, defaultKey: InputCode): void {
    if (reserved.has(id)) {
      throw new Error('illegal input id')
    }

    // @ts-expect-error String Union
    if (inputCodes.includes(id)) {
      throw new Error('input name cannot be a key code')
    }

    if (this.inputs.has(id)) {
      throw new Error(`the input "${id}" has already been registered`)
    }

    this.inputs.set(id, { defaultKey, name })
    this.updateInputs()
    this.emit('onRegistered', id)
  }

  /**
   * Get the human readable name and assigned keys for a registered input
   *
   * @param id - Input ID
   */
  public getRegisteredInput(id: string):
    | {
        name: string
        keys: readonly InputCode[]
      }
    | undefined {
    const input = this.inputs.get(id)
    if (!input) return undefined

    const keys = this.inputMap.get(id) ?? new Set()
    return { name: input.name, keys: [...keys] }
  }

  /**
   * Get a list of all registered inputs, their human readable names, and assigned keys
   */
  public getRegisteredInputs(): readonly (readonly [
    input: string,
    name: string,
    keys: readonly InputCode[],
  ])[] {
    const inputs = [...this.inputs.entries()]
    return inputs.map(([input, { name }]) => {
      const keys = this.inputMap.get(input) ?? new Set()
      return [input, name, [...keys]] as const
    })
  }

  /**
   * Bind a key to a named input.
   *
   * Pass `undefined` as the input to unbind the key from any inputs.
   *
   * @param key - Key Code
   * @param input - Input ID
   */
  public bindInput(key: InputCode, input: string | undefined): void {
    if (input) this.bindings.set(key, input)
    else this.bindings.delete(key)

    this.updateInputs()
  }
  // #endregion

  // #region Input Access
  /**
   * Get the human readable name for a named input
   *
   * @param input - Input ID
   */
  public getInputName(input: string): string | undefined {
    const mapped = this.inputs.get(input)
    if (!mapped) return undefined

    return mapped.name
  }

  /**
   * Get the current pressed state of a named input
   *
   * @param input - Input ID
   */
  public getInput(input: string): boolean | undefined {
    const keys = this.inputMap.get(input)
    if (!keys || keys.size === 0) return undefined

    return [...keys].some(key => this.getKey(key))
  }
  // #endregion

  // #region Mouse
  private isMouseInput(key: InputCode): boolean {
    return key.startsWith('Mouse')
  }

  private onMouseMove(this: InputManager, ev: MouseEvent): void {
    this.mousePosition = {
      x: ev.offsetX,
      y: ev.offsetY,
    }

    this.updateCursor()
  }

  private onMouseOut(): void {
    this.mousePosition = undefined
    this.updateCursor()
  }

  private onWheel(ev: WheelEvent): void {
    const disabled = this.disabled
    if (disabled === 'all') return

    this.emit('onWheel', ev)
  }

  private updateCursor(): void {
    this.cursorPosition = this.mousePosition
      ? this.camera.localToWorld(this.mousePosition)
      : undefined
  }

  /**
   * Get current cursor position in local or world space
   *
   * @param type - Defaults to `world`
   * @returns
   */
  public getCursor(type: 'local' | 'world' = 'world'): Vector | undefined {
    return type === 'local' ? this.mousePosition : this.cursorPosition
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
