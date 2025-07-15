import { ClientGame } from "@dreamlab/engine";
import { InspectorUI } from "./inspector.ts";
import { EditorFacadeTilemap } from "../../common/facades/tilemap.ts";

export class TileMapViewer {
  #section = (<section id="tilemap-viewer" />) as HTMLElement;
  #content = (<div id="tilemap-grid" />) as HTMLElement;

  private canvas!: HTMLCanvasElement;
  private ctx!: CanvasRenderingContext2D;

  private scale = 1;
  private offsetX = 0;
  private offsetY = 0;
  private isPanning = false;
  private panStart = { x: 0, y: 0 };

  private selectStart: { x: number; y: number } | null = null;
  private selectEnd: { x: number; y: number } | null = null;

  private selectedTiles = new Map<string, { x: number; y: number }>();
  private currentTilemap?: EditorFacadeTilemap;

  private atlasBitmap!: ImageBitmap;
  private imgW = 0;
  private imgH = 0;
  private resolution = 0;
  private chunkSize = 0;

  constructor(
    private game: ClientGame,
    private container: HTMLElement,
  ) {}

  setup(ui: InspectorUI): void {
    this.canvas = document.createElement("canvas");
    this.ctx = this.canvas.getContext("2d")!;
    this.ctx.imageSmoothingEnabled = false;
    this.#content.append(this.canvas);
    this.#section.append(this.#content);
    this.container.append(this.#section);

    this.canvas.style.width = "100%";
    this.canvas.style.height = "auto";
    this.canvas.style.display = "block";
    this.canvas.style.imageRendering = "pixelated";
    this.canvas.style.transformOrigin = "top left";

    this.canvas.addEventListener("wheel", e => {
      e.preventDefault();

      const oldScale = this.scale;
      const delta = e.deltaY < 0 ? 1.1 : 0.9;
      this.scale = Math.min(5, Math.max(0.2, this.scale * delta));

      const rect = this.canvas.getBoundingClientRect();
      const scaleX = this.canvas.width / rect.width;
      const scaleY = this.canvas.height / rect.height;
      const mx = (e.clientX - rect.left) * scaleX;
      const my = (e.clientY - rect.top) * scaleY;

      this.offsetX = mx - (mx - this.offsetX) * (this.scale / oldScale);
      this.offsetY = my - (my - this.offsetY) * (this.scale / oldScale);

      this.draw();
    });

    let isDragging = false;
    let addMode = false;

    this.canvas.addEventListener("mousedown", e => {
      e.preventDefault();

      if (e.button === 1) {
        this.isPanning = true;
        this.panStart = { x: e.clientX, y: e.clientY };
      } else if (e.button === 0) {
        const rect = this.canvas.getBoundingClientRect();
        const scaleX = this.canvas.width / rect.width;
        const scaleY = this.canvas.height / rect.height;

        const bx = (e.clientX - rect.left) * scaleX;
        const by = (e.clientY - rect.top) * scaleY;

        this.selectStart = { x: bx, y: by };

        this.selectEnd = null;
        isDragging = false;
        addMode = e.ctrlKey || e.metaKey;
      }
    });

    this.canvas.addEventListener("mousemove", e => {
      if (this.selectStart) {
        isDragging = true;
        const rect = this.canvas.getBoundingClientRect();
        const scaleX = this.canvas.width / rect.width;
        const scaleY = this.canvas.height / rect.height;
        const bx = (e.clientX - rect.left) * scaleX;
        const by = (e.clientY - rect.top) * scaleY;

        this.selectEnd = { x: bx, y: by };
        this.draw();
      } else if (this.isPanning) {
        e.preventDefault();
        this.offsetX += e.clientX - this.panStart.x;
        this.offsetY += e.clientY - this.panStart.y;
        this.panStart = { x: e.clientX, y: e.clientY };

        this.draw();
      }
    });

    globalThis.addEventListener("mouseup", e => {
      if (e.button === 1) this.isPanning = false;

      if (e.button === 0 && this.selectStart) {
        if (isDragging && this.selectEnd) {
          const x0 = Math.min(this.selectStart.x, this.selectEnd.x);
          const x1 = Math.max(this.selectStart.x, this.selectEnd.x);
          const y0 = Math.min(this.selectStart.y, this.selectEnd.y);
          const y1 = Math.max(this.selectStart.y, this.selectEnd.y);
          const map = addMode
            ? new Map(this.selectedTiles)
            : new Map<string, { x: number; y: number }>();
          for (
            let tx = Math.floor(x0 / this.resolution);
            tx <= Math.floor(x1 / this.resolution);
            tx++
          ) {
            for (
              let ty = Math.floor(y0 / this.resolution);
              ty <= Math.floor(y1 / this.resolution);
              ty++
            ) {
              map.set(`${tx}:${ty}`, { x: tx, y: ty });
            }
          }
          this.selectedTiles = map;
        } else {
          const rect = this.canvas.getBoundingClientRect();
          const scaleX = this.canvas.width / rect.width;
          const scaleY = this.canvas.height / rect.height;
          const bx = (e.clientX - rect.left) * scaleX;
          const by = (e.clientY - rect.top) * scaleY;

          const cx = bx;
          const cy = by;
          const tx = Math.floor(cx / this.resolution);
          const ty = Math.floor(cy / this.resolution);
          const key = `${tx}:${ty}`;
          if (addMode) {
            this.selectedTiles.has(key)
              ? this.selectedTiles.delete(key)
              : this.selectedTiles.set(key, { x: tx, y: ty });
          } else {
            this.selectedTiles.clear();
            this.selectedTiles.set(key, { x: tx, y: ty });
          }
        }

        if (this.currentTilemap) {
          const rows = this.imgH / this.resolution;
          const ids = Array.from(this.selectedTiles.keys()).map(key => {
            const [tx, ty] = key.split(":").map(n => parseInt(n, 10));
            return tx * rows + ty;
          });
          this.currentTilemap.paletteId = ids;
        }

        this.selectStart = this.selectEnd = null;
        isDragging = false;
        this.draw();
      }
    });

    ui.selectedEntity.listen(() => {
      const sel = ui.selectedEntity.entities;
      if (sel.length === 1 && sel[0] instanceof EditorFacadeTilemap) {
        const newTilemap = sel[0];
        if (this.currentTilemap !== newTilemap) {
          this.currentTilemap = newTilemap;
          this.loadAndDraw(newTilemap);
        }
      } else {
        this.currentTilemap = undefined;
        this.clear();
      }
    });
  }

  private loadAndDraw(tilemap: EditorFacadeTilemap) {
    this.clear();
    this.selectedTiles.clear();
    this.scale = 1;
    this.offsetX = this.offsetY = 0;

    const url = this.game.resolveResource(tilemap.atlas);
    this.resolution = tilemap.resolution;
    this.chunkSize = tilemap.chunkSize;

    const resValue = tilemap.values.get("resolution");
    resValue?.onChanged(() => {
      this.resolution = tilemap.resolution;
      this.selectedTiles.clear();
      this.draw();
    });

    fetch(url)
      .then(r => {
        if (!r.ok) throw new Error(r.statusText);
        return r.blob();
      })
      .then(b => createImageBitmap(b))
      .then(bitmap => {
        this.atlasBitmap = bitmap;
        this.imgW = bitmap.width;
        this.imgH = bitmap.height;
        this.canvas.width = this.imgW;
        this.canvas.height = this.imgH;
        this.draw();
      })
      .catch(err => {
        console.error("Failed to load atlas:", err);
        this.clear();
        const msg = document.createElement("div");
        msg.textContent = "Error loading tilemap atlas.";
        this.#content.append(msg);
      });
  }

  private draw() {
    const ctx = this.ctx;
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

    ctx.drawImage(this.atlasBitmap, 0, 0);

    ctx.strokeStyle = "rgba(255,255,255,0.25)";
    ctx.lineWidth = 1 / this.scale;
    const cols = this.imgW / this.resolution;
    const rows = this.imgH / this.resolution;
    for (let i = 1; i < cols; i++) {
      const x = i * this.resolution;
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, this.imgH);
      ctx.stroke();
    }
    for (let j = 1; j < rows; j++) {
      const y = j * this.resolution;
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(this.imgW, y);
      ctx.stroke();
    }

    ctx.strokeStyle = "rgba(255,0,0,0.5)";
    ctx.lineWidth = 2 / this.scale;
    const chunkCols = Math.floor(cols / this.chunkSize);
    const chunkRows = Math.floor(rows / this.chunkSize);
    for (let i = 1; i < chunkCols; i++) {
      const x = i * this.chunkSize * this.resolution;
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, this.imgH);
      ctx.stroke();
    }
    for (let j = 1; j < chunkRows; j++) {
      const y = j * this.chunkSize * this.resolution;
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(this.imgW, y);
      ctx.stroke();
    }

    if (this.selectStart && this.selectEnd) {
      ctx.strokeStyle = "rgba(0,255,0,0.5)";
      ctx.lineWidth = 2 / this.scale;
      const x0 = Math.min(this.selectStart.x, this.selectEnd.x);
      const x1 = Math.max(this.selectStart.x, this.selectEnd.x);
      const y0 = Math.min(this.selectStart.y, this.selectEnd.y);
      const y1 = Math.max(this.selectStart.y, this.selectEnd.y);
      ctx.strokeRect(x0, y0, x1 - x0, y1 - y0);
    }

    ctx.strokeStyle = "rgba(0,255,0,0.8)";
    ctx.lineWidth = 3 / this.scale;
    for (const { x, y } of this.selectedTiles.values()) {
      ctx.strokeRect(
        x * this.resolution,
        y * this.resolution,
        this.resolution,
        this.resolution,
      );
    }

    this.canvas.style.transform = `translate(${this.offsetX}px, ${this.offsetY}px) scale(${this.scale})`;
  }

  private clear() {
    this.selectedTiles.clear();
    this.#content.innerHTML = "";
    this.#content.append(this.canvas);
    this.ctx.setTransform(1, 0, 0, 1, 0, 0);
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
    this.canvas.style.transform = "none";
  }
}
