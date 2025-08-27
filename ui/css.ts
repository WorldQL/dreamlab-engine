import type { WritableKeysOf } from "./_types.ts";

type Style = CSSStyleDeclaration;

type LooseStringifiable<T> = T extends string ? string | number | boolean : T;

export type CSSProperties = {
  [K in WritableKeysOf<Style> as K extends number
    ? never
    : // deno-lint-ignore ban-types
      Style[K] extends Function
      ? never
      : K]?: LooseStringifiable<CSSStyleDeclaration[K]>;
};

export type ExtendedCSSProperties = CSSProperties & { [custom: `--${string}`]: string };

export function isCSSLengthProperty(key: string): boolean {
  if (["x", "y", "width", "height", "blockSize", "fontSize", "gap"].includes(key)) return true;
  if (key.includes("Width") || key.includes("Height") || key.includes("Radius")) return true;
  if (key.includes("BlockSize") || key.includes("Gap")) return true;
  if (key.startsWith("margin") || key.startsWith("padding")) return true;
  if (["top", "right", "bottom", "left"].includes(key)) return true;

  // TODO(char): any other cases?

  return false;
}
