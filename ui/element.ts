import { WritableKeysOf } from "@dreamlab/vendor/type-fest.ts";
import type { CSSProperties, ExtendedCSSProperties } from "./css.ts";

type BaseElem = HTMLElement | SVGElement;

export type ElementProps<E extends BaseElem> = {
  // deno-lint-ignore ban-types
  [K in WritableKeysOf<E> as NonNullable<E[K]> extends Function ? never : K]: E[K];
};

export interface ElementExtraProps<E extends BaseElem> {
  classList: string[];
  style: ExtendedCSSProperties;
  dataset: Record<string, string>;
  _also: (it: E) => void | ((it: E) => void)[];
}

export type ElementEventListeners<E extends BaseElem> = {
  [K in keyof HTMLElementEventMap as K extends string ? `on${Capitalize<K>}` : never]: (
    this: E,
    ev: HTMLElementEventMap[K],
  ) => void;
};

export type ElementDataAttributes = {
  [dataAttribute: `data-${string}`]: unknown;
};

export type ElementExtras<E extends BaseElem> = ElementExtraProps<E> & ElementEventListeners<E>; //  &
// ElementDataAttributes;

export type ElementAttributes<E extends BaseElem> = ElementExtras<E> &
  Omit<ElementProps<E>, keyof ElementExtras<E>>;

export function element<K extends keyof HTMLElementTagNameMap>(
  tag: K,
  attrs: Partial<ElementAttributes<HTMLElementTagNameMap[K]>> = {},
  children: (Element | string | Text)[] = [],
): HTMLElementTagNameMap[K] {
  const el = document.createElement(tag);
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
      el.addEventListener(key.substring(2).toLowerCase(), ev => f(ev));
    } else if (key.startsWith("data-") && value) {
      if (typeof value === "string") el.setAttribute(key, value);

      if (typeof value === "boolean") {
        if (value) el.setAttribute(key, "");
        else el.removeAttribute(key);
      }
    } else {
      el[key as keyof typeof el] = value;
    }
  }

  el.append(...children);

  if (_also) {
    if (Array.isArray(_also)) _also.forEach(also => also(el));
    else _also(el);
  }

  return el;
}
