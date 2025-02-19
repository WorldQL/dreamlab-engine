import { element, type ElementAttributes } from "./element.ts";

// deno-lint-ignore no-namespace
namespace JSX {
  export type Element = HTMLElement | SVGElement;
  export type IntrinsicElements = {
    [K in keyof HTMLElementTagNameMap]: Omit<
      Partial<ElementAttributes<HTMLElementTagNameMap[K]>>,
      "children"
    > & {
      children?: JSX.Element | JSX.Element[] | undefined;
    } & {
      // did you know JSX just disables typechecking for any attribute with a hyphen??
      // see TypeScript src/compiler/checker.ts, `isHyphenatedJsxName`
      [hyphenatedAttribute: `${string}-${string}`]: unknown;
    };
  };
}

function Fragment(_props: Record<string, unknown>, _key?: string): never {
  throw new Error("fragments aren't supported yet :(");
}

function jsx<K extends keyof HTMLElementTagNameMap>(
  tag: K,
  props: JSX.IntrinsicElements[K],
  _key?: string,
): HTMLElementTagNameMap[K] {
  const { children = [], ...attrs } = props;
  // if there's a singleton child, make an array
  let childrenArray = Array.isArray(children) ? children : [children];
  // filter out things that aren't text or elements
  childrenArray = childrenArray.filter(it => it instanceof Node || typeof it === "string");

  return element(
    tag,
    attrs as Partial<ElementAttributes<HTMLElementTagNameMap[K]>>,
    childrenArray,
  );
}

export { Fragment, jsx, jsx as jsxDEV, jsx as jsxs };
export type { JSX };
