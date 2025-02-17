import { element as elem, ElementAttrs } from "@dreamlab/ui";

export class Button extends HTMLElement {
  static {
    customElements.define("dreamlab-button", this);
  }

  constructor(
    attrs: ElementAttrs<HTMLElementTagNameMap["button"]> = {},
    children: (Element | string | Text)[] = [],
  ) {
    super();

    const element = elem("button", { ...attrs, type: "button" }, children);
    this.append(element);
  }
}
