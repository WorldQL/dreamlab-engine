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

  setHeaderContent(...title: (Element | string | Text)[]): void {
    console.log("setting header");

    const newHeader = elem("header", {}, title);
    this.#header.parentElement?.append(newHeader);
    this.#header.remove();
    this.#header = newHeader;
  }

  addContent(...content: (Node | string)[]) {
    this.#details.append(...content);
  }

  get open() {
    return this.#details.open;
  }
  set open(open: boolean) {
    this.#details.open = open;
  }
}
customElements.define("dreamlab-data-details", DataDetails);
