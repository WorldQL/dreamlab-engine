import { element as elem } from "@dreamlab/ui";
import { ChevronDown, icon } from "../_icons.ts";

export class DataTree extends HTMLElement {
  addNode(
    headerContent: (Element | string | Text)[],
    parent?: HTMLElement,
  ): HTMLDetailsElement {
    const toggle = elem("div", { className: "arrow" }, [icon(ChevronDown)]);
    const summary = elem("summary", {}, [toggle, ...headerContent]);
    const details = elem("details", { open: true }, [summary]);

    // only toggle when the arrow is clicked
    summary.addEventListener("click", ev => {
      ev.preventDefault();
    });
    toggle.addEventListener("click", () => {
      details.open = !details.open;
    });

    (parent ?? this).append(details);
    return details;
  }
}
customElements.define("dreamlab-data-tree", DataTree);
