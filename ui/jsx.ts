import type { CSSProperties, ExtendedCSSProperties } from "./css.ts";

// deno-lint-ignore-file no-explicit-any
export type ElementProps<E extends Element> = {
  // deno-lint-ignore ban-types
  [K in keyof E as E[K] extends Function ? never : K]?: E[K];
};

export interface ElementExtras<E extends Element> {
  classList?: string[];
  style?: ExtendedCSSProperties;
  onClick: () => void;
  _also: (it: E) => void;
}

// deno-lint-ignore no-namespace
namespace JSX {
  export type Element = HTMLElement | SVGElement;

  // Add an index signature for data-* attributes
  export type IntrinsicElements = {
    [K in keyof HTMLElementTagNameMap]: Omit<
      ElementProps<HTMLElementTagNameMap[K]>,
      "children" | keyof ElementExtras<HTMLElementTagNameMap[K]>
    > & {
      children?: JSX.Element | JSX.Element[] | undefined;
      // Allow data-* attributes
      [dataAttr: `data-${string}`]: unknown;
    } & Partial<ElementExtras<HTMLElementTagNameMap[K]>>;
  };
}

function Fragment(_props: Record<string, unknown>, _key?: string): never {
  throw new Error("fragments aren't supported yet :(");
}

function jsx<T extends keyof HTMLElementTagNameMap>(
  tag: T,
  props: JSX.IntrinsicElements[T],
  _key?: string,
): HTMLElementTagNameMap[T] {
  // Create the element
  const el = document.createElement(tag);

  // Extract known props
  const { children = [], classList, style, _also, onClick, ...rest } = props;
  const childrenArray = Array.isArray(children) ? children : [children];

  // Handle classList
  if (classList && Array.isArray(classList)) {
    classList.forEach(cls => el.classList.add(cls));
  }

  // Handle style
  if (style) {
    for (const [key, value] of Object.entries(style)) {
      if (key.startsWith("--")) {
        el.style.setProperty(key, value);
      } else {
        const k = key as keyof CSSProperties;
        if (value) el.style[k] = value;
        else delete el.style[k];
      }
    }
  }

  // Assign the remaining props, supporting data-* attributes
  for (const [key, value] of Object.entries(rest)) {
    if (key.startsWith("data-") && value) {
      el.setAttribute(key, String(value));
    } else {
      // Otherwise assign property directly
      el[key as keyof typeof el] = value;
    }
  }

  // Append children
  for (const child of childrenArray) {
    if (typeof child === "string") {
      el.appendChild(document.createTextNode(child));
    } else if (child instanceof Node) {
      el.appendChild(child);
    }
  }

  if (onClick) el.addEventListener("click", () => onClick());

  if (_also) _also(el);

  return el;
}

export { Fragment, jsx, jsx as jsxDEV, jsx as jsxs };
export type { JSX };
