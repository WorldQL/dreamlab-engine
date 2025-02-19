import * as CSS from "./css.ts";

export type ElementProps<E extends HTMLElement | SVGElement> = {
  // deno-lint-ignore ban-types
  [K in keyof E as E[K] extends Function ? never : K]?: E[K];
};

export type ElementExtras<E extends HTMLElement | SVGElement> = {
  classList?: string[];
  style?: CSS.Properties;
  dataset?: Record<string, string>;
  _also?: ((element: E) => void) | ((element: E) => void)[];
};

export type ElementAttrs<E extends HTMLElement | SVGElement> = ElementExtras<E> &
  Omit<ElementProps<E>, keyof ElementExtras<E>>;

export function element<K extends keyof HTMLElementTagNameMap>(
  tag: K,
  attrs: ElementAttrs<HTMLElementTagNameMap[K]> = {},
  children: (Element | string | Text)[] = [],
): HTMLElementTagNameMap[K] {
  const element = document.createElement(tag);

  const { classList, style, dataset, _also, ...rest } = attrs;
  Object.assign(element, rest);

  if (classList) classList.forEach(c => element.classList.add(c));
  if (style) Object.entries(style).forEach(([k, v]) => element.style.setProperty(k, v));
  if (dataset) Object.entries(dataset).forEach(([k, v]) => (element.dataset[k] = v));

  const nodes = children.map(e => (typeof e === "string" ? document.createTextNode(e) : e));
  element.append(...nodes);

  if (_also) {
    if (Array.isArray(_also)) _also.forEach(also => also(element));
    else _also(element);
  }

  return element;
}
