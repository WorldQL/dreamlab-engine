export type ElementProps<E extends Element> = {
  // afaik you cant detect "extends readonly" in TS so whatever
  // deno-lint-ignore ban-types
  [K in keyof E]?: E[K] extends Function ? never : E[K];
};

export function elem<K extends keyof HTMLElementTagNameMap>(
  tag: K,
  attrs: ElementProps<HTMLElementTagNameMap[K]> | ElementProps<HTMLElementTagNameMap[K]>[],
  children: (Element | string | Text)[] = [],
  extras: { classList?: string[] } = {},
): HTMLElementTagNameMap[K] {
  const element = document.createElement(tag);
  Object.assign(element, attrs);
  if (extras.classList) extras.classList.forEach(c => element.classList.add(c));

  const nodes = children.map(e => (typeof e === "string" ? document.createTextNode(e) : e));
  element.append(...nodes);

  return element;
}
