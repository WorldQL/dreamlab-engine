import { element as elem } from "@dreamlab/ui";
import { ChevronDown, icon } from "../_icons.ts";

declare global {
  interface HTMLElementEventMap {
    selectionchange: DataTreeSelectionChange;
  }
}

export class DataTreeSelectionChange extends Event {
  constructor(public readonly nodes: HTMLDetailsElement[]) {
    super("selectionchange");
  }
}

export class DataTree extends HTMLElement {
  static {
    customElements.define("dreamlab-data-tree", this);
  }

  #allowSelect: boolean;
  #allowMultiSelect: boolean;

  #selected = new Set<HTMLDetailsElement>();

  constructor({
    select = true,
    multiselect = true,
  }: { select?: boolean; multiselect?: boolean } = {}) {
    super();

    this.#allowSelect = select;
    this.#allowMultiSelect = multiselect;

    this.addEventListener("click", event => {
      if (!this.#allowSelect) return;
      if (!(event.target instanceof Element)) return;

      // TODO: handle range-select
      const selectMultiple = event.getModifierState("Control");
      const entryElement = event.target.closest("details > summary")?.parentNode as
        | HTMLDetailsElement
        | null
        | undefined;

      if (!entryElement) {
        this.#selected.clear();
      } else {
        if (selectMultiple && this.#allowMultiSelect) {
          if (this.#selected.has(entryElement)) this.#selected.delete(entryElement);
          else this.#selected.add(entryElement);
        } else {
          this.#selected.clear();
          this.#selected.add(entryElement);
        }
      }

      this.#updateSelectedDataset();
      this.dispatchEvent(new DataTreeSelectionChange([...this.#selected]));
    });
  }

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

  setNodeSelected(element: HTMLDetailsElement, selected: boolean) {
    if (selected) this.#selected.add(element);
    else this.#selected.delete(element);

    this.#updateSelectedDataset();
  }

  #updateSelectedDataset() {
    for (const details of Array.from(this.querySelectorAll("details"))) {
      if (this.#selected.has(details)) details.dataset.selected = "";
      else delete details.dataset.selected;
    }
  }
}
