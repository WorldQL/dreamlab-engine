import { ClientGame } from "@dreamlab/engine";
import { InspectorUI } from "./inspector.ts";
import { EditorFacadeTilemap } from "../../common/facades/tilemap.ts";
import * as PIXI from "@dreamlab/vendor/pixi.ts";

export class TileMapViewer {
  #section = (<section id="tilemap-viewer" />) as HTMLElement;
  #content = (<div id="tilemap-grid" />) as HTMLElement;

  static readonly MAX_TILES = 1024;

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

  private atlas: CanvasImageSource | null = null;
  private atlasWidth = 0;
  private atlasHeight = 0;
  private resolution = 0;

  private showingMessage = false;
  private messageElement: HTMLDivElement | null = null;
  private cleanupListeners: Array<() => void> = [];

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
          const zoomFactor = e.deltaY < 0 ? 1.05 : 0.95;
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
        if (!this.atlas || !this.resolution) {
          this.selectStart = this.selectEnd = null;
          this.draw();
          return;
        }

        const maxTileX = Math.floor(this.atlasWidth / this.resolution) - 1;
        const maxTileY = Math.floor(this.atlasHeight / this.resolution) - 1;
        const cols = Math.floor(this.atlasWidth / this.resolution);

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
              const paletteIndex = ty * cols + tx;
              if (paletteIndex >= TileMapViewer.MAX_TILES) continue;
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

          const paletteIndex = ty * cols + tx;
          if (paletteIndex >= TileMapViewer.MAX_TILES) {
            this.canvas.title = `Too many tiles - tile #${paletteIndex} cannot be selected.`;
            this.selectStart = this.selectEnd = null;
            isDragging = false;
            this.draw();
            return;
          }

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
          const rows = Math.floor(this.atlasHeight / this.resolution);
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
              if (
                paletteIndex < 0 ||
                paletteIndex >= total ||
                paletteIndex >= TileMapViewer.MAX_TILES
              )
                continue;
              ids[relY * w + relX] = paletteIndex;
            }

            this.currentTilemap.paletteId = ids;
            this.currentTilemap.paletteCols = w;
            this.currentTilemap.paletteRows = h;
            this.currentTilemap.paletteIdDirty = true;
          } else {
            this.currentTilemap.paletteId = [0];
            this.currentTilemap.paletteCols = 1;
            this.currentTilemap.paletteRows = 1;
            this.currentTilemap.paletteIdDirty = true;
          }
        }

        this.selectStart = this.selectEnd = null;
        isDragging = false;
        this.draw();
      }
    });

    ui.selectedEntity.listen(() => {
      this.cleanupListeners.forEach(fn => fn());
      this.cleanupListeners = [];

      const sel = ui.selectedEntity.entities;
      if (sel.length === 1 && sel[0] instanceof EditorFacadeTilemap) {
        const newTilemap = sel[0];
        if (this.currentTilemap !== newTilemap) {
          this.currentTilemap = newTilemap;
          this.loadAndDraw(newTilemap);

          const resValue = newTilemap.values.get("resolution");
          const atlasValue = newTilemap.values.get("atlas");

          if (resValue) {
            const onResChanged = () => {
              this.resolution = newTilemap.resolution;
              this.selectedTiles.clear();
              this.draw();
            };
            resValue.onChanged(onResChanged);
            this.cleanupListeners.push(() => {
              resValue.removeChangeListener?.(onResChanged);
            });
          }

          if (atlasValue) {
            const onAtlasChanged = () => {
              this.loadAndDraw(newTilemap);
            };
            atlasValue.onChanged(onAtlasChanged);
            this.cleanupListeners.push(() => {
              atlasValue.removeChangeListener?.(onAtlasChanged);
            });
          }
        }
      } else {
        this.currentTilemap = undefined;
        this.clear();
      }
    });
  }

  private async loadAndDraw(tilemap: EditorFacadeTilemap) {
    this.clear();
    this.selectedTiles.clear();
    this.scale = 1;
    this.offsetX = this.offsetY = 0;
    this.resolution = tilemap.resolution;
    const path = tilemap.atlas.trim();

    if (!path) {
      this.atlas = null;
      this.atlasWidth = this.atlasHeight = 0;
      this.draw();
      this.showMessage("No atlas assigned.");
      return;
    }

    this.showMessage("Add atlas to tilemap entity.");

    const tex = await PIXI.Assets.load(this.game.resolveResource(path));
    if (!(tex instanceof PIXI.Texture)) {
      this.atlas = null;
      this.atlasWidth = this.atlasHeight = 0;
      this.draw();
      this.showMessage("Failed to load atlas.");
      return;
    }
    const img = (tex.source as { resource: HTMLImageElement }).resource;

    this.atlas = img;
    this.atlasWidth = img.width;
    this.atlasHeight = img.height;
    this.canvas.width = img.width;
    this.canvas.height = img.height;

    this.hideMessage();
    this.draw();
  }

  private showMessage(text: string) {
    this.showingMessage = true;
    this.canvas.style.display = "none";

    const c = this.#content;
    c.style.display = "flex";
    c.style.flexDirection = "column";
    c.style.alignItems = "center";
    c.style.justifyContent = "center";
    c.style.minHeight = "100%";

    if (!this.messageElement) {
      this.messageElement = document.createElement("div");
      this.messageElement.style.padding = "8px 12px";
      this.messageElement.style.fontSize = "13px";
      this.messageElement.style.opacity = "0.75";
      this.messageElement.style.pointerEvents = "none";
      c.append(this.messageElement);
    }
    this.messageElement.textContent = text;
  }

  private hideMessage() {
    if (!this.showingMessage) return;
    this.showingMessage = false;
    const c = this.#content;
    c.style.display = "";
    c.style.flexDirection = "";
    c.style.alignItems = "";
    c.style.justifyContent = "";
    c.style.minHeight = "";
    if (this.messageElement) {
      this.messageElement.remove();
      this.messageElement = null;
    }
    this.canvas.style.display = "block";
    if (!c.contains(this.canvas)) c.append(this.canvas);
  }

  private draw() {
    const ctx = this.ctx;
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

    if (!this.atlas) {
      this.canvas.style.transform = `translate(${this.offsetX}px, ${this.offsetY}px) scale(${this.scale})`;
      return;
    }

    this.hideMessage();

    ctx.drawImage(this.atlas, 0, 0);

    ctx.strokeStyle = "rgba(255,255,255,0.25)";
    ctx.lineWidth = 1 / this.scale;
    const cols = this.atlasWidth / this.resolution;
    const rows = this.atlasHeight / this.resolution;
    for (let i = 1; i < cols; i++) {
      const x = i * this.resolution;
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, this.atlasHeight);
      ctx.stroke();
    }
    for (let j = 1; j < rows; j++) {
      const y = j * this.resolution;
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(this.atlasWidth, y);
      ctx.stroke();
    }

    if (cols * rows > TileMapViewer.MAX_TILES) {
      ctx.strokeStyle = "rgba(255,51,51,0.5)";
      ctx.lineWidth = 2 / this.scale;
      for (let idx = TileMapViewer.MAX_TILES; idx < cols * rows; idx++) {
        const tx = idx % cols;
        const ty = Math.floor(idx / cols);
        const x = tx * this.resolution;
        const y = ty * this.resolution;
        ctx.beginPath();
        ctx.moveTo(x, y);
        ctx.lineTo(x + this.resolution, y + this.resolution);
        ctx.moveTo(x + this.resolution, y);
        ctx.lineTo(x, y + this.resolution);
        ctx.stroke();
      }
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
    this.hideMessage();
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
