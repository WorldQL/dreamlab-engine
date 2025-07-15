import { ClientGame, Tilemap } from "@dreamlab/engine";
import { InspectorUI } from "./inspector.ts";

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
      if (sel.length === 1 && sel[0] instanceof Tilemap) {
        this.render(sel[0]);
      } else {
        this.clear();
      }
    });
  }

  private render(tilemap: Tilemap) {
    this.clear();

    const meta = document.createElement("div");
    meta.innerHTML = `
      <strong>TileMap: ${tilemap.name}</strong><br>
      Resolution: ${tilemap.resolution}<br>
      Chunk Size: ${tilemap.chunkSize}<br>
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
