import { BaseElement, element, type ElementAttributes } from "./element.ts";
import { TagNames, TagType } from "./tags.ts";

// deno-lint-ignore no-namespace
namespace JSX {
  export type Element = BaseElement;
  export type Children = JSX.Element | string | number | boolean | undefined | JSX.Children[];
  // TODO: Properly narrow type, HTMLElementTagNameMap isn't working and <div> is simply an Element when the line below is uncommented. Having this be an HTMLElement is much less annoying.
  // export type Element = HTMLElement | SVGElement;
  export type IntrinsicElements = {
    [K in TagNames]: Omit<Partial<ElementAttributes<K>>, "children"> & {
      children?: JSX.Children;
    } & {
      // did you know JSX just disables typechecking for any attribute with a hyphen??
      // see TypeScript src/compiler/checker.ts, `isHyphenatedJsxName`
      [hyphenatedAttribute: `${string}-${string}`]: unknown;
    };
  };

  export interface IntrinsicAttributes {
    children?: JSX.Children;
  }
}

function Fragment(_props: Record<string, unknown>, _key?: string): never {
  throw new Error("fragments aren't supported yet :(");
}

function jsx<K extends TagNames>(
  tag: K,
  props: JSX.IntrinsicElements[K],
  _key?: string,
): TagType<K> {
  // @ts-expect-error: this works but the types are annoying so i didnt bother
  if (typeof tag === "function") return tag(props);

  const { children = [], ...attrs } = props;
  // if there's a singleton child, make an array
  const childrenArray = Array.isArray(children) ? children : [children];
  const childrenArray2 = childrenArray
    .flat()
    .filter(it => it !== false && it !== undefined && it !== null)
    .map(it => {
      if (it instanceof Element) return it;
      return String(it);
    });

  return element(tag, attrs as Partial<ElementAttributes<K>>, childrenArray2);
}

export { Fragment, jsx, jsx as jsxDEV, jsx as jsxs };
export type { JSX };
