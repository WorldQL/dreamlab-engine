import { element as elem, ElementProps } from "@dreamlab/ui";

export class Button extends HTMLElement {
  static {
    customElements.define("dreamlab-button", this);
  }

  constructor(
    attrs: ElementProps<HTMLElementTagNameMap["button"]> = {},
    children: (Element | string | Text)[] = [],
  ) {
    super();

    const element = elem("button", { ...attrs, type: "button" }, children);
    this.append(element);
  }
}
