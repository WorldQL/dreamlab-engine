// deno-lint-ignore-file no-explicit-any
import type { ElementPropertyMap } from "./_jsx_codegen/element-property-map.generated.ts";
import { isCSSLengthProperty, type CSSProperties, type ExtendedCSSProperties } from "./css.ts";
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

// export type ElementEventListeners<E extends BaseElement> = {
//   [K in keyof HTMLElementEventMap as K extends string ? `on${Capitalize<K>}` : never]: (
//     this: E,
//     ev: HTMLElementEventMap[K],
//   ) => void;
// };
// ☝️ produces onMousedown instead of onMouseDown
// let's just hardcode it:
export type ElementEventListeners<E extends BaseElement> = {
  onAbort: (this: E, ev: HTMLElementEventMap["abort"]) => void;
  onAnimationCancel: (this: E, ev: HTMLElementEventMap["animationcancel"]) => void;
  onAnimationEnd: (this: E, ev: HTMLElementEventMap["animationend"]) => void;
  onAnimationIteration: (this: E, ev: HTMLElementEventMap["animationiteration"]) => void;
  onAnimationStart: (this: E, ev: HTMLElementEventMap["animationstart"]) => void;
  onAuxClick: (this: E, ev: HTMLElementEventMap["auxclick"]) => void;
  onBeforeInput: (this: E, ev: HTMLElementEventMap["beforeinput"]) => void;
  onBlur: (this: E, ev: HTMLElementEventMap["blur"]) => void;
  onCancel: (this: E, ev: HTMLElementEventMap["cancel"]) => void;
  onCanPlay: (this: E, ev: HTMLElementEventMap["canplay"]) => void;
  onCanPlayThrough: (this: E, ev: HTMLElementEventMap["canplaythrough"]) => void;
  onChange: (this: E, ev: HTMLElementEventMap["change"]) => void;
  onClick: (this: E, ev: HTMLElementEventMap["click"]) => void;
  onClose: (this: E, ev: HTMLElementEventMap["close"]) => void;
  onCompositionEnd: (this: E, ev: HTMLElementEventMap["compositionend"]) => void;
  onCompositionStart: (this: E, ev: HTMLElementEventMap["compositionstart"]) => void;
  onCompositionUpdate: (this: E, ev: HTMLElementEventMap["compositionupdate"]) => void;
  onContextMenu: (this: E, ev: HTMLElementEventMap["contextmenu"]) => void;
  onCopy: (this: E, ev: HTMLElementEventMap["copy"]) => void;
  onCueChange: (this: E, ev: HTMLElementEventMap["cuechange"]) => void;
  onCut: (this: E, ev: HTMLElementEventMap["cut"]) => void;
  onDblClick: (this: E, ev: HTMLElementEventMap["dblclick"]) => void;
  onDrag: (this: E, ev: HTMLElementEventMap["drag"]) => void;
  onDragEnd: (this: E, ev: HTMLElementEventMap["dragend"]) => void;
  onDragEnter: (this: E, ev: HTMLElementEventMap["dragenter"]) => void;
  onDragLeave: (this: E, ev: HTMLElementEventMap["dragleave"]) => void;
  onDragOver: (this: E, ev: HTMLElementEventMap["dragover"]) => void;
  onDragStart: (this: E, ev: HTMLElementEventMap["dragstart"]) => void;
  onDrop: (this: E, ev: HTMLElementEventMap["drop"]) => void;
  onDurationChange: (this: E, ev: HTMLElementEventMap["durationchange"]) => void;
  onEmptied: (this: E, ev: HTMLElementEventMap["emptied"]) => void;
  onEnded: (this: E, ev: HTMLElementEventMap["ended"]) => void;
  onError: (this: E, ev: HTMLElementEventMap["error"]) => void;
  onFocus: (this: E, ev: HTMLElementEventMap["focus"]) => void;
  onFocusIn: (this: E, ev: HTMLElementEventMap["focusin"]) => void;
  onFocusOut: (this: E, ev: HTMLElementEventMap["focusout"]) => void;
  onFormData: (this: E, ev: HTMLElementEventMap["formdata"]) => void;
  onFullscreenChange: (this: E, ev: HTMLElementEventMap["fullscreenchange"]) => void;
  onFullscreenError: (this: E, ev: HTMLElementEventMap["fullscreenerror"]) => void;
  onGotPointerCapture: (this: E, ev: HTMLElementEventMap["gotpointercapture"]) => void;
  onInput: (this: E, ev: HTMLElementEventMap["input"]) => void;
  onInvalid: (this: E, ev: HTMLElementEventMap["invalid"]) => void;
  onKeyDown: (this: E, ev: HTMLElementEventMap["keydown"]) => void;
  onKeyPress: (this: E, ev: HTMLElementEventMap["keypress"]) => void;
  onKeyUp: (this: E, ev: HTMLElementEventMap["keyup"]) => void;
  onLoad: (this: E, ev: HTMLElementEventMap["load"]) => void;
  onLoadedData: (this: E, ev: HTMLElementEventMap["loadeddata"]) => void;
  onLoadedMetadata: (this: E, ev: HTMLElementEventMap["loadedmetadata"]) => void;
  onLoadStart: (this: E, ev: HTMLElementEventMap["loadstart"]) => void;
  onLostPointerCapture: (this: E, ev: HTMLElementEventMap["lostpointercapture"]) => void;
  onMouseDown: (this: E, ev: HTMLElementEventMap["mousedown"]) => void;
  onMouseEnter: (this: E, ev: HTMLElementEventMap["mouseenter"]) => void;
  onMouseLeave: (this: E, ev: HTMLElementEventMap["mouseleave"]) => void;
  onMouseMove: (this: E, ev: HTMLElementEventMap["mousemove"]) => void;
  onMouseOut: (this: E, ev: HTMLElementEventMap["mouseout"]) => void;
  onMouseOver: (this: E, ev: HTMLElementEventMap["mouseover"]) => void;
  onMouseUp: (this: E, ev: HTMLElementEventMap["mouseup"]) => void;
  onPaste: (this: E, ev: HTMLElementEventMap["paste"]) => void;
  onPause: (this: E, ev: HTMLElementEventMap["pause"]) => void;
  onPlay: (this: E, ev: HTMLElementEventMap["play"]) => void;
  onPlaying: (this: E, ev: HTMLElementEventMap["playing"]) => void;
  onPointerCancel: (this: E, ev: HTMLElementEventMap["pointercancel"]) => void;
  onPointerDown: (this: E, ev: HTMLElementEventMap["pointerdown"]) => void;
  onPointerEnter: (this: E, ev: HTMLElementEventMap["pointerenter"]) => void;
  onPointerLeave: (this: E, ev: HTMLElementEventMap["pointerleave"]) => void;
  onPointerMove: (this: E, ev: HTMLElementEventMap["pointermove"]) => void;
  onPointerOut: (this: E, ev: HTMLElementEventMap["pointerout"]) => void;
  onPointerOver: (this: E, ev: HTMLElementEventMap["pointerover"]) => void;
  onPointerUp: (this: E, ev: HTMLElementEventMap["pointerup"]) => void;
  onProgress: (this: E, ev: HTMLElementEventMap["progress"]) => void;
  onRateChange: (this: E, ev: HTMLElementEventMap["ratechange"]) => void;
  onReset: (this: E, ev: HTMLElementEventMap["reset"]) => void;
  onResize: (this: E, ev: HTMLElementEventMap["resize"]) => void;
  onScroll: (this: E, ev: HTMLElementEventMap["scroll"]) => void;
  onSecurityPolicyViolation: (
    this: E,
    ev: HTMLElementEventMap["securitypolicyviolation"],
  ) => void;
  onSeeked: (this: E, ev: HTMLElementEventMap["seeked"]) => void;
  onSeeking: (this: E, ev: HTMLElementEventMap["seeking"]) => void;
  onSelect: (this: E, ev: HTMLElementEventMap["select"]) => void;
  onSelectionChange: (this: E, ev: HTMLElementEventMap["selectionchange"]) => void;
  onSelectStart: (this: E, ev: HTMLElementEventMap["selectstart"]) => void;
  onSlotChange: (this: E, ev: HTMLElementEventMap["slotchange"]) => void;
  onStalled: (this: E, ev: HTMLElementEventMap["stalled"]) => void;
  onSubmit: (this: E, ev: HTMLElementEventMap["submit"]) => void;
  onSuspend: (this: E, ev: HTMLElementEventMap["suspend"]) => void;
  onTimeUpdate: (this: E, ev: HTMLElementEventMap["timeupdate"]) => void;
  onToggle: (this: E, ev: HTMLElementEventMap["toggle"]) => void;
  onTouchCancel: (this: E, ev: HTMLElementEventMap["touchcancel"]) => void;
  onTouchEnd: (this: E, ev: HTMLElementEventMap["touchend"]) => void;
  onTouchMove: (this: E, ev: HTMLElementEventMap["touchmove"]) => void;
  onTouchStart: (this: E, ev: HTMLElementEventMap["touchstart"]) => void;
  onTransitionCancel: (this: E, ev: HTMLElementEventMap["transitioncancel"]) => void;
  onTransitionEnd: (this: E, ev: HTMLElementEventMap["transitionend"]) => void;
  onTransitionRun: (this: E, ev: HTMLElementEventMap["transitionrun"]) => void;
  onTransitionStart: (this: E, ev: HTMLElementEventMap["transitionstart"]) => void;
  onVolumeChange: (this: E, ev: HTMLElementEventMap["volumechange"]) => void;
  onWaiting: (this: E, ev: HTMLElementEventMap["waiting"]) => void;
  onWebkitAnimationEnd: (this: E, ev: HTMLElementEventMap["webkitanimationend"]) => void;
  onWebkitAnimationIteration: (
    this: E,
    ev: HTMLElementEventMap["webkitanimationiteration"],
  ) => void;
  onWebkitAnimationStart: (this: E, ev: HTMLElementEventMap["webkitanimationstart"]) => void;
  onWebkitTransitionEnd: (this: E, ev: HTMLElementEventMap["webkittransitionend"]) => void;
  onWheel: (this: E, ev: HTMLElementEventMap["wheel"]) => void;
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
        el.style.setProperty(key, value as string | null);
      } else {
        const k = key as keyof CSSProperties;
        if (value != undefined) {
          const v = (
            isCSSLengthProperty(key) && typeof value === "number" ? value + "px" : value
          ) as string;
          el.style[k] = v;
        } else {
          delete el.style[k];
        }
      }
    }
  }

  if (dataset) Object.entries(dataset).forEach(([k, v]) => (el.dataset[k] = v));

  for (const [key, value_] of Object.entries(rest)) {
    const value = value_ as any;

    if (value === undefined || value === null) continue;

    if (key.startsWith("on") && typeof value === "function") {
      // bind once
      const handler = value.bind(el as any);

      // 1) install it on the DOM-property so it replaces cleanly:
      //    e.g. el.onclick, el.onmousedown, etc.
      (el as any)[key.toLowerCase()] = handler;

      // 2) stash the bound function itself so we can diff later:
      // confused about the duplicate map? https://chatgpt.com/share/682ba2d5-eee4-8011-866b-91408eb6772c
      (el as any)[key] = handler;
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
