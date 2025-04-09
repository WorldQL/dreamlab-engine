import { element as elem, ElementAttributes, ElementProps } from "@dreamlab/ui";
import { icon } from "../_icons.tsx";

export class IconButton extends HTMLElement {
  static {
    customElements.define("dreamlab-icon-button", this);
  }

  constructor(svg: string, attrs?: Partial<ElementAttributes<"button">>) {
    super();

    const id = attrs?.id;
    if (id) this.id = id;
    delete attrs?.id;

    const element = elem("button", { ...attrs, type: "button" }, [icon(svg)]);
    this.append(element);
  }

  setIcon(svg: string) {
    const button = this.querySelector("button");
    if (!button) return;
    button.innerHTML = "";
    button.append(icon(svg));
  }

  setAttrs(attrs: Partial<ElementProps<"button">>) {
    const button = this.querySelector("button");
    if (!button) return;
    Object.assign(button, attrs);
  }

  disable() {
    this.querySelector("button")?.classList.add("disabled");
  }

  enable() {
    this.querySelector("button")?.classList.remove("disabled");
  }
}
