export function isMac(): boolean {
  const userAgent = navigator.userAgent || "";
  return /Mac|iPod|iPhone|iPad/.test(userAgent);
}

/**
 * Returns the appropriate modifier key symbol based on the user's platform.
 * - '⌘' for macOS
 * - 'Ctrl' for others
 */
export function getModifierKeySymbol(): string {
  return isMac() ? "⌘" : "Ctrl";
}

/**
 * Returns the appropriate modifier key name based on the user's platform.
 * - 'Cmd' for macOS
 * - 'Ctrl' for others
 */
export function getModifierKeyName(): string {
  return isMac() ? "Cmd" : "Ctrl";
}
