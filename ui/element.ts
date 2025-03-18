import type { ElementPropertyMap } from "./_jsx_codegen/element-property-map.generated.ts";
import type { CSSProperties, ExtendedCSSProperties } from "./css.ts";
import { SVG_NAMESPACE, SVG_TAG_NAMES, TagNames, TagType, VOID_TAG_NAMES } from "./tags.ts";

export type BaseElement = HTMLElement | SVGElement;

export type ElementProps<T extends TagNames> = T extends keyof ElementPropertyMap
  ? ElementPropertyMap[T]
  : { [K in keyof TagType<T>]: TagType<T>[K] };

export interface ElementExtraProps<E extends BaseElement> {
  classList: string[];
  style: ExtendedCSSProperties;
  dataset: Record<string, string>;
  _also: (it: E) => void | ((it: E) => void)[];
}

export type ElementEventListeners<E extends BaseElement> = {
  [K in keyof HTMLElementEventMap as K extends string ? `on${Capitalize<K>}` : never]: (
    this: E,
    ev: HTMLElementEventMap[K],
  ) => void;
};

export type ElementDataAttributes = {
  [dataAttribute: `data-${string}`]: unknown;
};

export type ElementExtras<E extends BaseElement> = ElementExtraProps<E> &
  ElementEventListeners<E>; //  &
// ElementDataAttributes;

export type ElementAttributes<T extends TagNames> = ElementExtras<TagType<T>> &
  Omit<
    TagType<T> extends SVGElement ? Record<string, unknown> : ElementProps<T>,
    keyof ElementExtras<TagType<T>>
  >;

export function element<K extends TagNames>(
  tag: K,
  attrs: Partial<ElementAttributes<K>> = {},
  children: (Element | string | Text)[] = [],
): TagType<K> {
  const el = (
    SVG_TAG_NAMES.includes(tag)
      ? document.createElementNS(SVG_NAMESPACE, tag)
      : document.createElement(tag)
  ) as TagType<K>;
  const { classList, style, _also, dataset, ...rest } = attrs;

  if (classList) classList.forEach(c => el.classList.add(c));
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

  if (dataset) Object.entries(dataset).forEach(([k, v]) => (el.dataset[k] = v));

  for (const [key, value_] of Object.entries(rest)) {
    // deno-lint-ignore no-explicit-any
    const value = value_ as any;

    if (value === undefined || value === null) continue;

    if (key.startsWith("on") && typeof value === "function") {
      const f = value.bind(el);
      (el as BaseElement).addEventListener(key.substring(2).toLowerCase(), ev => f(ev));
    } else if (key.startsWith("data-") && value) {
      if (typeof value === "string") el.setAttribute(key, value);

      if (typeof value === "boolean") {
        if (value) el.setAttribute(key, "");
        else el.removeAttribute(key);
      }
    } else {
      if (SVG_TAG_NAMES.includes(tag)) {
        el.setAttribute(key, value);
      } else {
        // @ts-expect-error blind assignment
        el[key] = value;
      }
    }
  }

  // void tags cannot have children
  if (!VOID_TAG_NAMES.includes(tag)) el.append(...children);

  if (_also) {
    if (Array.isArray(_also)) _also.forEach(also => also(el));
    else _also(el);
  }

  return el;
}
