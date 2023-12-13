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
export type LetterKey = z.infer<typeof LetterSchema>
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
export type DigitKey = z.infer<typeof DigitSchema>
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
  'ControlLeft',
  'ControlRight',
  'Space',
  'Tab',
  'Backspace',
  'BracketLeft',
  'BracketRight',
  'Backslash',
  'Backquote',
] as const
export type SpecialKey = z.infer<typeof SpecialSchema>
const SpecialSchema = z.enum(special)

const mouseButtons = ['MouseLeft', 'MouseMiddle', 'MouseRight'] as const
export type MouseButton = z.infer<typeof MouseButtonSchema>
const MouseButtonSchema = z.enum(mouseButtons)

export type InputCode = z.infer<typeof InputCodeSchema>
export const InputCodeSchema = LetterSchema.or(DigitSchema)
  .or(SpecialSchema)
  .or(MouseButtonSchema)

export const inputCodes = Object.freeze([
  ...letters,
  ...digits,
  ...special,
  ...mouseButtons,
] as const)
