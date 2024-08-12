export type ElementProps<E extends Element> = {
  // afaik you cant detect "extends readonly" in TS so whatever
  // deno-lint-ignore ban-types
  [K in keyof E]?: E[K] extends Function ? never : E[K];
};

export function element<K extends keyof HTMLElementTagNameMap>(
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
