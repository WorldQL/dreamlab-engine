import { element, ElementExtras, ElementProps } from "./element.ts";

// deno-lint-ignore no-namespace
namespace JSX {
  export type Element = HTMLElement | SVGElement;
  export type IntrinsicElements = {
    [K in keyof HTMLElementTagNameMap]: Omit<
      ElementProps<HTMLElementTagNameMap[K]>,
      "children"
    > & {
      children?: JSX.Element | JSX.Element[] | undefined;
    } & Partial<ElementExtras<HTMLElementTagNameMap[K]>>;
  };
}

function Fragment(_props: Record<string, unknown>, _key?: string): never {
  throw new Error("fragments aren't supported yet :(");
}

function jsx<T extends keyof HTMLElementTagNameMap>(
  tag: T,
  props: Record<string, unknown>,
  _key?: string,
): HTMLElementTagNameMap[T] {
  const { children = [], classList, style, _also, ...attrs } = props;
  const childrenArray = Array.isArray(children) ? children : [children];
  const extras = { classList, styleMap: style, _also } as ElementExtras<HTMLElementTagNameMap[T]>;
  return element(tag, attrs as ElementProps<HTMLElementTagNameMap[T]>, childrenArray, extras);
}

export { Fragment, jsx, jsx as jsxDEV, jsx as jsxs };
export type { JSX };
