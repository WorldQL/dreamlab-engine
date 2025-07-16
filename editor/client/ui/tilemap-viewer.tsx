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

    this.#content.addEventListener(
      "wheel",
      e => {
        e.preventDefault();

        const isZoomGesture = e.ctrlKey || e.metaKey || e.altKey;

        if (isZoomGesture) {
          const oldScale = this.scale;
          const zoomFactor = e.deltaY < 0 ? 1.1 : 0.9;
          this.scale = Math.min(5, Math.max(0.2, this.scale * zoomFactor));

          const rect = this.canvas.getBoundingClientRect();
          const scaleX = this.canvas.width / rect.width;
          const scaleY = this.canvas.height / rect.height;
          let mx = (e.clientX - rect.left) * scaleX;
          let my = (e.clientY - rect.top) * scaleY;

          if (mx < 0 || mx > this.canvas.width || my < 0 || my > this.canvas.height) {
            mx = this.canvas.width / 2;
            my = this.canvas.height / 2;
          }

          this.offsetX = mx - (mx - this.offsetX) * (this.scale / oldScale);
          this.offsetY = my - (my - this.offsetY) * (this.scale / oldScale);
          this.clampPan();
          this.draw();
        } else {
          const { deltaX, deltaY, deltaMode } = e;
          const factor = deltaMode === 1 ? 16 : 1;
          this.offsetX -= deltaX * factor;
          this.offsetY -= deltaY * factor;
          this.clampPan();
          this.draw();
        }
      },
      { passive: false },
    );

    let isDragging = false;
    let addMode = false;

    this.canvas.addEventListener("mousedown", e => {
      e.preventDefault();

      if (e.button === 1) {
        this.isPanning = true;
        this.panStart = { x: e.clientX, y: e.clientY };
        this.selectStart = this.selectEnd = null;
        return;
      }

      if (e.button === 0) {
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
      if (this.isPanning) {
        e.preventDefault();
        this.offsetX += e.clientX - this.panStart.x;
        this.offsetY += e.clientY - this.panStart.y;
        this.panStart = { x: e.clientX, y: e.clientY };
        this.clampPan();
        this.draw();
        return;
      }

      if (this.selectStart) {
        isDragging = true;
        const rect = this.canvas.getBoundingClientRect();
        const scaleX = this.canvas.width / rect.width;
        const scaleY = this.canvas.height / rect.height;
        const bx = (e.clientX - rect.left) * scaleX;
        const by = (e.clientY - rect.top) * scaleY;
        this.selectEnd = { x: bx, y: by };
        this.draw();
      }
    });

    globalThis.addEventListener("mouseup", e => {
      if (e.button === 1 && this.isPanning) {
        this.isPanning = false;
        return;
      }

      if (e.button === 0 && this.selectStart) {
        const maxTileX = Math.floor(this.imgW / this.resolution) - 1;
        const maxTileY = Math.floor(this.imgH / this.resolution) - 1;

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
            if (tx < 0 || tx > maxTileX) continue;
            for (
              let ty = Math.floor(y0 / this.resolution);
              ty <= Math.floor(y1 / this.resolution);
              ty++
            ) {
              if (ty < 0 || ty > maxTileY) continue;
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

          let tx = Math.floor(bx / this.resolution);
          let ty = Math.floor(by / this.resolution);
          if (tx < 0) tx = 0;
          if (ty < 0) ty = 0;
          if (tx > maxTileX) tx = maxTileX;
          if (ty > maxTileY) ty = maxTileY;

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
          const cols = Math.floor(this.imgW / this.resolution);
          const rows = Math.floor(this.imgH / this.resolution);
          const total = cols * rows;
          const tileCoords = Array.from(this.selectedTiles.values());

          if (tileCoords.length > 0) {
            let minX = Infinity,
              minY = Infinity,
              maxX = -Infinity,
              maxY = -Infinity;
            for (const t of tileCoords) {
              if (t.x < minX) minX = t.x;
              if (t.y < minY) minY = t.y;
              if (t.x > maxX) maxX = t.x;
              if (t.y > maxY) maxY = t.y;
            }
            const w = maxX - minX + 1;
            const h = maxY - minY + 1;

            const ids: number[] = new Array(w * h).fill(-1);
            for (const t of tileCoords) {
              const relX = t.x - minX;
              const relY = t.y - minY;
              const paletteIndex = t.y * cols + t.x;
              if (paletteIndex < 0 || paletteIndex >= total) continue;
              ids[relY * w + relX] = paletteIndex;
            }

            this.currentTilemap.paletteId = ids;
            this.currentTilemap.paletteCols = w;
            this.currentTilemap.paletteRows = h;
          } else {
            this.currentTilemap.paletteId = [0];
            this.currentTilemap.paletteCols = 1;
            this.currentTilemap.paletteRows = 1;
          }
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
    ctx.lineWidth = 2 / this.scale;
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

  private getViewSize() {
    const el = this.#content;
    return { w: el.clientWidth, h: el.clientHeight };
  }

  private clampPan() {
    const { w: viewW, h: viewH } = this.getViewSize();

    const baseW = this.canvas.offsetWidth || viewW;
    const baseH = this.canvas.offsetHeight || viewH;
    const scaledW = baseW * this.scale;
    const scaledH = baseH * this.scale;

    const gutter = 64;
    const maxX = gutter;
    const minX = -(scaledW - viewW) - gutter;
    const maxY = gutter;
    const minY = -(scaledH - viewH) - gutter;

    if (scaledW <= viewW) {
      const centerX = (viewW - scaledW) / 2;
      this.offsetX = Math.min(maxX, Math.max(minX, this.offsetX));
      if (this.offsetX < centerX - gutter) this.offsetX = centerX - gutter;
      if (this.offsetX > centerX + gutter) this.offsetX = centerX + gutter;
    } else {
      if (this.offsetX < minX) this.offsetX = minX;
      if (this.offsetX > maxX) this.offsetX = maxX;
    }

    if (scaledH <= viewH) {
      const centerY = (viewH - scaledH) / 2;
      this.offsetY = Math.min(maxY, Math.max(minY, this.offsetY));
      if (this.offsetY < centerY - gutter) this.offsetY = centerY - gutter;
      if (this.offsetY > centerY + gutter) this.offsetY = centerY + gutter;
    } else {
      if (this.offsetY < minY) this.offsetY = minY;
      if (this.offsetY > maxY) this.offsetY = maxY;
    }
  }
}
