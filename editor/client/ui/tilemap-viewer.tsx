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

    const url = this.game.resolveResource(tilemap.atlas);

    fetch(url)
      .then(res => {
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        return res.blob();
      })
      .then(blob => createImageBitmap(blob))
      .then(bitmap => {
        const width = bitmap.width;
        const height = bitmap.height;

        const resolution = tilemap.resolution;
        const chunkSize = tilemap.chunkSize;
        const tileW = width / resolution;
        const tileH = height / resolution;

        const canvas = document.createElement("canvas");
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext("2d")!;
        ctx.drawImage(bitmap, 0, 0);

        ctx.strokeStyle = "rgba(255,255,255,0.25)";
        ctx.lineWidth = 1;
        for (let i = 1; i < resolution; i++) {
          ctx.beginPath();
          ctx.moveTo(i * tileW, 0);
          ctx.lineTo(i * tileW, height);
          ctx.stroke();
        }
        for (let j = 1; j < resolution; j++) {
          ctx.beginPath();
          ctx.moveTo(0, j * tileH);
          ctx.lineTo(width, j * tileH);
          ctx.stroke();
        }

        this.#content.append(canvas);
      })
      .catch(err => {
        console.error("TileMapViewer failed to load atlas:", err);
        const errDiv = document.createElement("div");
        errDiv.textContent = `Failed to load tilemap atlas: ${err.message}`;
        this.#content.append(errDiv);
      });
  }

  private clear() {
    this.#content.innerHTML = "";
  }
}
