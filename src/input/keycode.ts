import { z } from 'zod'

const letters = [
  'KeyA',
  'KeyB',
  'KeyC',
  'KeyD',
  'KeyE',
  'KeyF',
  'KeyG',
  'KeyH',
  'KeyI',
  'KeyJ',
  'KeyK',
  'KeyL',
  'KeyM',
  'KeyN',
  'KeyO',
  'KeyP',
  'KeyQ',
  'KeyR',
  'KeyS',
  'KeyT',
  'KeyU',
  'KeyV',
  'KeyW',
  'KeyX',
  'KeyY',
  'KeyZ',
] as const
const LetterSchema = z.enum(letters)

const digits = [
  'Digit0',
  'Digit1',
  'Digit2',
  'Digit3',
  'Digit4',
  'Digit5',
  'Digit6',
  'Digit7',
  'Digit8',
  'Digit9',
] as const
const DigitSchema = z.enum(digits)

const special = [
  'ArrowDown',
  'ArrowLeft',
  'ArrowRight',
  'ArrowUp',
  'Enter',
  'Semicolon',
  'ShiftLeft',
  'ShiftRight',
  'Space',
  'Tab',
] as const
const SpecialSchema = z.enum(special)

const mouseButtons = ['MouseLeft', 'MouseMiddle', 'MouseRight'] as const
const MouseButtonSchema = z.enum(mouseButtons)

export type KeyCode = z.infer<typeof KeyCodeSchema>
export const KeyCodeSchema = LetterSchema.or(DigitSchema)
  .or(SpecialSchema)
  .or(MouseButtonSchema)

export const keyCodes = Object.freeze([
  ...letters,
  ...digits,
  ...special,
  ...mouseButtons,
] as const)
