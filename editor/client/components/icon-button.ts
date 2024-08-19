import { element as elem } from "@dreamlab/ui";
import { icon } from "../_icons.ts";

export class IconButton extends HTMLElement {
  static {
    customElements.define("dreamlab-icon-button", this);
  }

  constructor(svg: string) {
    super();

    const element = elem("button", { type: "button" }, [icon(svg)]);
    this.append(element);
  }
}
