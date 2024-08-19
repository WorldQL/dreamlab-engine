import { element as elem } from "@dreamlab/ui";
import { ChevronDown, icon } from "../_icons.ts";

export class DataTree extends HTMLElement {
  addNode(
    headerContent: (Element | string | Text)[],
    parent?: HTMLElement,
  ): HTMLDetailsElement {
    const summary = elem("summary", {}, [
      elem("div", { className: "arrow" }, [icon(ChevronDown)]),
      ...headerContent,
    ]);

    const details = elem("details", { open: true }, [summary]);
    (parent ?? this).append(details);
    return details;
  }
}
customElements.define("dreamlab-data-tree", DataTree);
