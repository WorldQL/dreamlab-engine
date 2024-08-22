import { element } from "@dreamlab/ui";

export class DataTable extends HTMLElement {
  entries = new Map<string, HTMLTableRowElement>();

  #table = element("table");

  constructor() {
    super();
    this.append(this.#table);
  }

  addEntry(id: string, key: string, ...value: (Element | string | Text)[]) {
    if (this.entries.has(id)) return;

    const row = element("tr", {}, [
      element("th", {}, [key]),
      element("td", { colSpan: 2 }, value),
    ]);
    this.#table.append(row);
    this.entries.set(id, row);
  }

  removeEntry(id: string) {
    const row = this.entries.get(id);
    if (row) row.remove();
    this.entries.delete(id);
  }

  addFullWidthEntry(id: string, ...value: (Element | string | Text)[]) {
    const row = element("tr", {}, [element("td", { colSpan: 3 }, value)]);
    this.#table.append(row);
    this.entries.set(id, row);
  }

  reorderEntries(ids: string[]) {
    for (const entry of this.entries.values()) entry.remove();
    const keys = [...this.entries.keys()].toSorted((a, b) => ids.indexOf(a) - ids.indexOf(b));
    for (const key of keys) {
      const entry = this.entries.get(key)!;
      this.#table.append(entry);
    }
  }

  // TODO: reorderEntries
}
customElements.define("dreamlab-data-table", DataTable);
