import { ClientGame } from "@dreamlab/engine";
import { InspectorUI } from "./inspector.ts";
import { EditorFacadeTilemap } from "../../common/facades/tilemap.ts";

export class TileMapViewer {
  #section = (<section id="tilemap-viewer" />) as HTMLElement;
  #content = (<div id="tilemap-grid" />) as HTMLElement;

  constructor(
    private game: ClientGame,
    private container: HTMLElement,
  ) {}

  setup(ui: InspectorUI): void {
    this.#section.append(this.#content);
    this.container.append(this.#section);

    ui.selectedEntity.listen(() => {
      const sel = ui.selectedEntity.entities;
      if (sel.length === 1 && sel[0] instanceof EditorFacadeTilemap) {
        this.render(sel[0]);
      } else {
        this.clear();
      }
    });
  }

  private render(tilemap: EditorFacadeTilemap) {
    this.clear();

    const meta = document.createElement("div");
    meta.innerHTML = `
      <strong>TileMap: ${tilemap.name}</strong><br>
    `;
    this.#content.append(meta);

    const pre = document.createElement("pre");
    pre.textContent = JSON.stringify(tilemap.data, null, 2);
    this.#content.append(pre);
  }

  private clear() {
    this.#content.innerHTML = "";
  }
}
