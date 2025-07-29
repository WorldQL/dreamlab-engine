import { ClientGame } from "@dreamlab/engine";
import { InspectorUI } from "./inspector.ts";
import { EditorFacadeTilemap } from "../../common/facades/tilemap.ts";
import * as PIXI from "@dreamlab/vendor/pixi.ts";

export class TileMapViewer {
  #section = (<section id="tilemap-viewer" />) as HTMLElement;
  #content = (<div id="tilemap-grid" />) as HTMLElement;

  static readonly MAX_TILES = 1024;
  private static readonly BASE_MAX_SCALE = 5;
  private static readonly TARGET_TILE_SIZE = 64;

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
        const zoom = e.ctrlKey || e.metaKey || e.altKey;

        if (zoom) {
          const old = this.scale;
          const zf = e.deltaY < 0 ? 1.15 : 1 / 1.15;
          const max = Math.max(
            TileMapViewer.BASE_MAX_SCALE,
            TileMapViewer.TARGET_TILE_SIZE / this.resolution,
          );
          this.scale = Math.min(max, Math.max(0.2, this.scale * zf));

          const { x: mx, y: my } = this.screenToAtlas(e);
          this.offsetX = mx - (mx - this.offsetX) * (this.scale / old);
          this.offsetY = my - (my - this.offsetY) * (this.scale / old);
        } else {
          const factor = e.deltaMode === 1 ? 16 : 1;
          const pf = 1 / Math.min(Math.max(this.scale, 1), 4);
          this.offsetX -= e.deltaX * factor * pf;
          this.offsetY -= e.deltaY * factor * pf;
        }

        this.clampPan();
        this.draw();
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
        const { x, y } = this.screenToAtlas(e);
        this.selectStart = { x, y };
        this.selectEnd = null;
        isDragging = false;
        addMode = e.ctrlKey || e.metaKey;
      }
    });

    this.canvas.addEventListener("mousemove", e => {
      if (this.isPanning) {
        e.preventDefault();
        const pf = 1 / Math.min(Math.max(this.scale, 1), 4);
        this.offsetX += (e.clientX - this.panStart.x) * pf;
        this.offsetY += (e.clientY - this.panStart.y) * pf;
        this.panStart = { x: e.clientX, y: e.clientY };
        this.clampPan();
        this.draw();
        return;
      }

      if (this.selectStart) {
        isDragging = true;
        const { x, y } = this.screenToAtlas(e);
        this.selectEnd = { x, y };
        this.draw();
      }
    });

    globalThis.addEventListener("mouseup", e => {
      if (e.button === 1 && this.isPanning) {
        this.isPanning = false;
        return;
      }
      if (e.button !== 0 || !this.selectStart) return;

      if (!this.atlas || !this.resolution) {
        this.selectStart = this.selectEnd = null;
        this.draw();
        return;
      }
      const cols = Math.floor(this.atlasWidth / this.resolution);
      const maxTileX = cols - 1;
      const maxTileY = Math.floor(this.atlasHeight / this.resolution) - 1;

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
        const { x: ax, y: ay } = this.screenToAtlas(e);
        let tx = Math.floor(ax / this.resolution);
        let ty = Math.floor(ay / this.resolution);
        if (tx < 0) tx = 0;
        if (ty < 0) ty = 0;
        if (tx > maxTileX) tx = maxTileX;
        if (ty > maxTileY) ty = maxTileY;

        const paletteIndex = ty * cols + tx;
        if (paletteIndex < TileMapViewer.MAX_TILES) {
          const key = `${tx}:${ty}`;
          if (addMode) {
            this.selectedTiles.has(key)
              ? this.selectedTiles.delete(key)
              : this.selectedTiles.set(key, { x: tx, y: ty });
          } else {
            this.selectedTiles.clear();
            this.selectedTiles.set(key, { x: tx, y: ty });
          }
        } else {
          this.canvas.title = "All tiles below this line cannot be selected.";
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
    });

    ui.selectedEntity.listen(() => {
      this.cleanupListeners.forEach(fn => fn());
      this.cleanupListeners = [];

      const sel = ui.selectedEntity.entities;
      if (sel.length === 1 && sel[0] instanceof EditorFacadeTilemap) {
        const tm = sel[0];
        if (this.currentTilemap !== tm) {
          this.currentTilemap = tm;
          this.loadAndDraw(tm);

          const resVal = tm.values.get("resolution");
          const atlasVal = tm.values.get("atlas");

          if (resVal) {
            const onRes = () => {
              this.resolution = tm.resolution;
              this.selectedTiles.clear();
              this.draw();
            };
            resVal.onChanged(onRes);
            this.cleanupListeners.push(() => resVal.removeChangeListener?.(onRes));
          }

          if (atlasVal) {
            const onAtlas = () => this.loadAndDraw(tm);
            atlasVal.onChanged(onAtlas);
            this.cleanupListeners.push(() => atlasVal.removeChangeListener?.(onAtlas));
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

    if (tilemap.paletteId.length > 0) {
      const cols = this.atlasWidth / tilemap.resolution;
      for (const idx of tilemap.paletteId) {
        const x = idx % cols;
        const y = Math.floor(idx / cols);
        this.selectedTiles.set(`${x}:${y}`, { x, y });
      }
    }

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
      const snapX = Math.round(this.offsetX);
      const snapY = Math.round(this.offsetY);
      ctx.setTransform(this.scale, 0, 0, this.scale, snapX, snapY);
      return;
    }

    ctx.imageSmoothingEnabled = false;
    ctx.imageSmoothingQuality = "low";

    const snapX = Math.round(this.offsetX);
    const snapY = Math.round(this.offsetY);
    ctx.setTransform(this.scale, 0, 0, this.scale, snapX, snapY);

    const dpr = window.devicePixelRatio || 1;
    const pxPerTile = this.resolution * this.scale;
    const tinyMode = pxPerTile < 4;
    const lineW = 1 / (dpr * this.scale);
    const halfLine = lineW * 0.5;

    ctx.drawImage(this.atlas, 0, 0);

    const cols = this.atlasWidth / this.resolution;
    const rows = this.atlasHeight / this.resolution;
    const selectableRows = Math.ceil(TileMapViewer.MAX_TILES / cols);
    const selectableH = selectableRows * this.resolution;

    if (!tinyMode) {
      const MIN_GAP = 4;
      const step = Math.max(1, Math.ceil(MIN_GAP / pxPerTile));

      ctx.strokeStyle = "rgba(255,255,255,0.45)";
      ctx.lineWidth = lineW;

      for (let i = step; i < cols; i += step) {
        const x = i * this.resolution + halfLine;
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, selectableH);
        ctx.stroke();
      }

      for (let j = step; j < selectableRows; j += step) {
        const y = j * this.resolution + halfLine;
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(this.atlasWidth, y);
        ctx.stroke();
      }
    } else {
      ctx.fillStyle = "rgba(255,255,255,0.07)";
      for (let y = 0; y < selectableRows; ++y) {
        for (let x = y & 1; x < cols; x += 2) {
          ctx.fillRect(
            x * this.resolution,
            y * this.resolution,
            this.resolution,
            this.resolution,
          );
        }
      }
    }

    if (rows * cols > TileMapViewer.MAX_TILES) {
      ctx.strokeStyle = "rgba(255,51,51,0.9)";
      ctx.lineWidth = lineW;
      const y = selectableH + halfLine;
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(this.atlasWidth, y);
      ctx.stroke();
    }

    if (this.selectStart && this.selectEnd) {
      ctx.strokeStyle = "rgba(0,255,0,0.6)";
      ctx.lineWidth = lineW;

      const x0 = Math.min(this.selectStart.x, this.selectEnd.x);
      const x1 = Math.max(this.selectStart.x, this.selectEnd.x);
      const y0 = Math.min(this.selectStart.y, this.selectEnd.y);
      const y1 = Math.max(this.selectStart.y, this.selectEnd.y);

      ctx.strokeRect(x0 + halfLine, y0 + halfLine, x1 - x0, y1 - y0);
    }

    if (!tinyMode) {
      ctx.strokeStyle = "rgba(0,255,0,0.9)";
      ctx.lineWidth = lineW;

      for (const { x, y } of this.selectedTiles.values()) {
        ctx.strokeRect(
          x * this.resolution + halfLine,
          y * this.resolution + halfLine,
          this.resolution,
          this.resolution,
        );
      }
    } else {
      ctx.fillStyle = "rgba(0,255,0,0.35)";
      for (const { x, y } of this.selectedTiles.values()) {
        ctx.fillRect(
          x * this.resolution,
          y * this.resolution,
          this.resolution,
          this.resolution,
        );
      }
    }
  }

  private screenToAtlas(e: MouseEvent | WheelEvent) {
    const rect = this.canvas.getBoundingClientRect();
    const scaleX = this.canvas.width / rect.width;
    const scaleY = this.canvas.height / rect.height;

    const cx = (e.clientX - rect.left) * scaleX;
    const cy = (e.clientY - rect.top) * scaleY;

    return {
      x: (cx - this.offsetX) / this.scale,
      y: (cy - this.offsetY) / this.scale,
    };
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

    const gutter = 64 / this.scale;

    if (scaledW <= viewW) {
      const cx = (viewW - scaledW) / 2;
      this.offsetX = Math.min(cx + gutter, Math.max(cx - gutter, this.offsetX));
    } else {
      const minX = -(scaledW - viewW) - gutter;
      const maxX = gutter;
      this.offsetX = Math.min(maxX, Math.max(minX, this.offsetX));
    }

    if (scaledH <= viewH) {
      const cy = (viewH - scaledH) / 2;
      this.offsetY = Math.min(cy + gutter, Math.max(cy - gutter, this.offsetY));
    } else {
      const minY = -(scaledH - viewH) - gutter;
      const maxY = gutter;
      this.offsetY = Math.min(maxY, Math.max(minY, this.offsetY));
    }
  }
}
