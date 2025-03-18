import { element as elem, ElementAttributes } from "@dreamlab/ui";

export class Button extends HTMLElement {
  static {
    customElements.define("dreamlab-button", this);
  }

  constructor(
    attrs: Partial<ElementAttributes<"button">> = {},
    children: (Element | string | Text)[] = [],
  ) {
    super();

    const element = elem("button", { ...attrs, type: "button" }, children);
    this.append(element);
  }
}
