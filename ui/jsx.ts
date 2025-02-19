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

// deno-lint-ignore no-explicit-any
function convertKeysToKebabCase<T extends Record<string, any>>(obj: T): Record<string, any> {
  // deno-lint-ignore no-explicit-any
  const result: Record<string, any> = {};
  for (const key in obj) {
    if (Object.prototype.hasOwnProperty.call(obj, key)) {
      // Convert camelCase to kebab-case using regex
      const kebabKey = key.replace(/([a-z])([A-Z])/g, "$1-$2").toLowerCase();
      result[kebabKey] = obj[key];
    }
  }
  return result;
}

function jsx<T extends keyof HTMLElementTagNameMap>(
  tag: T,
  props: Record<string, unknown>,
  _key?: string,
): HTMLElementTagNameMap[T] {
  const { children = [], classList, style, _also, ...attrs } = props;
  const childrenArray = Array.isArray(children) ? children : [children];
  // deno-lint-ignore no-explicit-any
  const convertedStyles = convertKeysToKebabCase(style as Record<string, any>);
  const extras = { classList, styleMap: convertedStyles, _also } as ElementExtras<
    HTMLElementTagNameMap[T]
  >;
  return element(tag, attrs as ElementProps<HTMLElementTagNameMap[T]>, childrenArray, extras);
}

export { Fragment, jsx, jsx as jsxDEV, jsx as jsxs };
export type { JSX };
