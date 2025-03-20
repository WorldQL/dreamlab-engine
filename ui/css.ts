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
