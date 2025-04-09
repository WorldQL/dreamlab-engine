export type Input = (typeof inputs)[number];
export const inputs = [
  // Letters
  "KeyA",
  "KeyB",
  "KeyC",
  "KeyD",
  "KeyE",
  "KeyF",
  "KeyG",
  "KeyH",
  "KeyI",
  "KeyJ",
  "KeyK",
  "KeyL",
  "KeyM",
  "KeyN",
  "KeyO",
  "KeyP",
  "KeyQ",
  "KeyR",
  "KeyS",
  "KeyT",
  "KeyU",
  "KeyV",
  "KeyW",
  "KeyX",
  "KeyY",
  "KeyZ",

  // Digits
  "Digit0",
  "Digit1",
  "Digit2",
  "Digit3",
  "Digit4",
  "Digit5",
  "Digit6",
  "Digit7",
  "Digit8",
  "Digit9",

  // Arrows & Basic Controls
  "ArrowDown",
  "ArrowLeft",
  "ArrowRight",
  "ArrowUp",
  "Enter",
  "Escape",
  "Tab",
  "Space",
  "Backspace",
  "Delete",

  // Modifiers
  "ShiftLeft",
  "ShiftRight",
  "ControlLeft",
  "ControlRight",
  "AltLeft",
  "AltRight",
  "MetaLeft",
  "MetaRight",
  "CapsLock",

  // Symbols / Punctuation
  "Semicolon",
  "BracketLeft",
  "BracketRight",
  "Backslash",
  "Backquote",
  "Minus",
  "Equal",
  "Comma",
  "Period",
  "Slash",
  "Quote",

  // Misc
  "Insert",
  "Home",
  "End",
  "PageUp",
  "PageDown",
  "NumLock",
  "ScrollLock",
  "Pause",

  // Mouse
  "MouseLeft",
  "MouseRight",
  "MouseMiddle",
] as const;

export function isInput(input: string): input is Input {
  // @ts-expect-error type narrowing
  return inputs.includes(input);
}
