import { element, ElementAttrs } from "./element.ts";

// deno-lint-ignore no-namespace
namespace JSX {
  export type Element = HTMLElement | SVGElement;
  export type IntrinsicElements = {
    [K in keyof HTMLElementTagNameMap]: Omit<
      ElementAttrs<HTMLElementTagNameMap[K]>,
      "children"
    > & {
      children?: JSX.Element | JSX.Element[] | undefined;
    } & Partial<ElementAttrs<HTMLElementTagNameMap[K]>>;
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
  const { children = [] } = props;
  const childrenArray = Array.isArray(children) ? children : [children];
  return element(tag, props as ElementAttrs<HTMLElementTagNameMap[T]>, childrenArray);
}

export { Fragment, jsx, jsx as jsxDEV, jsx as jsxs };
export type { JSX };
