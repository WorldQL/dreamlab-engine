import type { WritableKeysOf } from "@dreamlab/vendor/type-fest.ts";

type Style = CSSStyleDeclaration;

export type CSSProperties = {
  [K in WritableKeysOf<Style> as K extends number
    ? never
    : // deno-lint-ignore ban-types
      Style[K] extends Function
      ? never
      : K]?: CSSStyleDeclaration[K];
};

export type ExtendedCSSProperties = CSSProperties & { [custom: `--${string}`]: string };
