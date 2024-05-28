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

  // Special
  "ArrowDown",
  "ArrowLeft",
  "ArrowRight",
  "ArrowUp",
  "Enter",
  "Semicolon",
  "ShiftLeft",
  "ShiftRight",
  "ControlLeft",
  "ControlRight",
  "Space",
  "Tab",
  "Backspace",
  "BracketLeft",
  "BracketRight",
  "Backslash",
  "Backquote",
  "Delete",

  // Mouse
  "MouseLeft",
  "MouseRight",
  "MouseMiddle",
] as const;

export function isInput(input: string): input is Input {
  // @ts-expect-error type narrowing
  return inputs.includes(input);
}
