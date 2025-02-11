export type ElementProps<E extends Element> = {
  // deno-lint-ignore ban-types
  [K in keyof E as E[K] extends Function ? never : K]?: K extends "style"
    ? string | CSSStyleDeclaration
    : E[K];
};

/** @deprecated */
export function __deprecated__element<K extends keyof HTMLElementTagNameMap>(
  tag: K,
  {
    id,
    props = {},
    style = {},
    classList = [],
    children = [],
  }: {
    id?: string;
    props?: ElementProps<HTMLElementTagNameMap[K]>;
    style?: Partial<CSSStyleDeclaration>;
    classList?: readonly string[];
    children?: (Element | string | Text)[];
  } = {},
): HTMLElementTagNameMap[K] {
  const element = document.createElement(tag);
  if (id) element.id = id;

  for (const cl of classList) element.classList.add(cl);
  Object.assign(element.style, style);
  Object.assign(element, props);

  const nodes = children.map(e => (typeof e === "string" ? document.createTextNode(e) : e));
  element.append(...nodes);

  return element;
}

export interface ElementExtras<E extends Element> {
  classList?: string[];
  styleMap?: Record<string, string>;
  _also?: ((element: E) => void) | ((element: E) => void)[];
}

export function element<K extends keyof HTMLElementTagNameMap>(
  tag: K,
  attrs: ElementProps<HTMLElementTagNameMap[K]> | ElementProps<HTMLElementTagNameMap[K]>[] = {},
  children: (Element | string | Text)[] = [],
  extras: ElementExtras<HTMLElementTagNameMap[K]> = {},
): HTMLElementTagNameMap[K] {
  const element = document.createElement(tag);
  Object.assign(element, attrs);
  if (extras.classList) extras.classList.forEach(c => element.classList.add(c));
  if (extras.styleMap)
    Object.entries(extras.styleMap).forEach(([k, v]) => element.style.setProperty(k, v));

  const nodes = children.map(e => (typeof e === "string" ? document.createTextNode(e) : e));
  element.append(...nodes);

  if (extras._also) {
    if (Array.isArray(extras._also)) extras._also.forEach(also => also(element));
    else extras._also(element);
  }

  return element;
}
