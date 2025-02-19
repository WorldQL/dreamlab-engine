// deno-lint-ignore-file no-explicit-any
export type ElementProps<E extends Element> = {
  // deno-lint-ignore ban-types
  [K in keyof E as E[K] extends Function ? never : K]?: K extends "style"
    ? string | Partial<CSSStyleDeclaration>
    : E[K];
};

export interface ElementExtras<E extends Element> {
  classList?: string[];
  styleMap?: Record<string, string>;
}

// deno-lint-ignore no-namespace
namespace JSX {
  export type Element = HTMLElement | SVGElement;

  // Add an index signature for data-* attributes
  export type IntrinsicElements = {
    [K in keyof HTMLElementTagNameMap]: Omit<
      ElementProps<HTMLElementTagNameMap[K]>,
      "children"
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

function convertKeysToKebabCase<T extends Record<string, any>>(obj: T): Record<string, any> {
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
  // Create the element
  const el = document.createElement(tag);

  // Extract known props
  const { children = [], classList, style, _also, onClick, ...rest} = props;
  const childrenArray = Array.isArray(children) ? children : [children];

  // Handle classList
  if (classList && Array.isArray(classList)) {
    classList.forEach(cls => el.classList.add(cls));
  }

  // Handle style
  if (style) {
    // Convert camelCase to kebab-case and set styles
    const convertedStyles = convertKeysToKebabCase(style as Record<string, unknown>);
    Object.entries(convertedStyles).forEach(([k, v]) => {
      el.style.setProperty(k, String(v));
    });
  }

  // Assign the remaining props, supporting data-* attributes
  for (const [key, value] of Object.entries(rest)) {
    if (key.startsWith("data-") && value) {
      el.setAttribute(key, String(value));
    } else {
      // Otherwise assign property directly
      (el as any)[key] = value;
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

  if (onClick) {
    console.log(el)
    el.addEventListener('click', () => {
      onClick();
    });
  }

  return el;
}

export { Fragment, jsx, jsx as jsxDEV, jsx as jsxs };
export type { JSX };
