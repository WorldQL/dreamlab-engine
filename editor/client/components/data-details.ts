import { element as elem } from "@dreamlab/ui";
import { ChevronDown, icon } from "../_icons.ts";

export class DataDetails extends HTMLElement {
  #details: HTMLDetailsElement;
  #header: HTMLElement;

  constructor() {
    super();
    this.#header = elem("header", {}, ["dreamlab-data-details"]);

    this.#details = elem("details", { open: true }, [
      elem("summary", {}, [
        elem("div", { className: "arrow" }, [icon(ChevronDown)]),
        this.#header,
      ]),
    ]);

    this.append(this.#details);
  }

  setHeader(...title: (Element | string | Text)[]): void {
    const newHeader = elem("header", {}, title);
    this.#header.outerHTML = newHeader.outerHTML;
  }

  addContent(...content: (Node | string)[]) {
    this.#header.append(...content);
  }

  get open() {
    return this.#details.open;
  }
  set open(open: boolean) {
    this.#details.open = open;
  }
}
customElements.define("dreamlab-data-details", DataDetails);
