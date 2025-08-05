import { element as elem, ElementAttributes, ElementProps } from "@dreamlab/ui";
import { icon } from "../_icons.tsx";

export class IconButton extends HTMLElement {
  static {
    customElements.define("dreamlab-icon-button", this);
  }

  constructor(svg: string, attrs: Partial<ElementAttributes<"button">> = {}, label?: string) {
    super();

    if (attrs.id) {
      this.id = attrs.id;
      delete attrs.id;
    }

    const children: Array<string | Element | Text> = [icon(svg) as Element];
    if (label)
      children.push(
        elem(
          "span",
          { className: "label", style: { paddingRight: "0.4rem", fontSize: "14px" } },
          [label],
        ),
      );

    const element = elem("button", { ...attrs, type: "button" }, children);
    this.append(element);
  }

  setIcon(svg: string) {
    const button = this.querySelector("button");
    if (!button) return;
    button.innerHTML = "";
    button.append(icon(svg));
  }

  setLabel(label?: string) {
    const button = this.querySelector("button");
    if (!button) return;

    button.querySelector(".label")?.remove();

    if (label) button.append(elem("span", { className: "label" }, [label]));
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
