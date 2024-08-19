import { element as elem, ElementProps } from "@dreamlab/ui";
import { icon } from "../_icons.ts";

export class IconButton extends HTMLElement {
  static {
    customElements.define("dreamlab-icon-button", this);
  }

  constructor(svg: string, attrs?: ElementProps<HTMLElementTagNameMap["button"]>) {
    super();

    const element = elem("button", { ...attrs, type: "button" }, [icon(svg)]);
    this.append(element);
  }
}
