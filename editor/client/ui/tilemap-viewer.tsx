import { ClientGame, IVector2, Vector2 } from "@dreamlab/engine";
import { InspectorUI } from "./inspector.ts";
import { EditorFacadeTilemap } from "../../common/facades/tilemap.ts";
import * as PIXI from "@dreamlab/vendor/pixi.ts";

const PINCH_THRESHOLD = 50;
const SCROLL_THRESHOLD = 15;
const PINCH_SENS = 0.012;

const isPinch = (ev: WheelEvent) => {
  return (ev.ctrlKey || ev.metaKey) && Math.abs(ev.deltaY) < PINCH_THRESHOLD && ev.deltaY !== 0;
};

const isTrackpadScroll = (ev: WheelEvent) => {
  const wheelDeltaY = (ev as unknown as { wheelDeltaY?: number }).wheelDeltaY ?? 0;
  return (
    wheelDeltaY === -3 * ev.deltaY && ev.deltaY !== 0 && Math.abs(ev.deltaY) < SCROLL_THRESHOLD
  );
};

export class TileMapViewer {
  constructor(
    private game: ClientGame,
    private container: HTMLElement,
  ) {}

  #isTouchpad: boolean = false;

  #app!: PIXI.Application;
  #sprite!: PIXI.Sprite;
  #grid!: PIXI.Graphics;
  #drag!: PIXI.Graphics;
  #selected!: PIXI.Graphics;

  #tilemap: EditorFacadeTilemap | undefined;
  #listeners: (() => void)[] = [];

  #zoom: number = 3;
  #pan: Vector2 = Vector2.ZERO;
  #panning: IVector2 | undefined = undefined;
  #dragging: { start: IVector2; end: IVector2 } | undefined = undefined;
  #selectedTiles = new Set<number>();

  async setup(ui: InspectorUI, content: HTMLDivElement): Promise<void> {
    const app = new PIXI.Application();
    await app.init({
      autoDensity: true,
      resizeTo: this.container,
      antialias: true,
      resolution: globalThis.devicePixelRatio,
      backgroundAlpha: 0,
    });

    app.canvas.width = content.clientWidth;
    app.canvas.height = content.clientHeight;

    this.container.appendChild(app.canvas);
    this.#app = app;

    const ro = new ResizeObserver(() => app.queueResize());
    ro.observe(this.container);

    this.#sprite = new PIXI.Sprite({ anchor: { x: 0.5, y: 0.5 } });
    this.#app.stage.addChild(this.#sprite);

    this.#grid = new PIXI.Graphics();
    this.#app.stage.addChild(this.#grid);

    this.#drag = new PIXI.Graphics();
    this.#app.stage.addChild(this.#drag);

    this.#selected = new PIXI.Graphics();
    this.#app.stage.addChild(this.#selected);

    app.ticker.add(() => {
      const { width, height } = this.#app.canvas;
      const x = width / 2 + this.#pan.x;
      const y = height / 2 + this.#pan.y;

      this.#app.stage.position.set(x, y);
      this.#app.stage.scale.set(this.#zoom);

      if (this.#dragging) {
        const start = this.#screenToWorld(this.#dragging.start);
        const end = this.#screenToWorld(this.#dragging.end);

        const x0 = Math.min(start.x, end.x);
        const x1 = Math.max(start.x, end.x);
        const y0 = Math.min(start.y, end.y);
        const y1 = Math.max(start.y, end.y);

        const width = x1 - x0;
        const height = y1 - y0;

        this.#drag
          .clear()
          .rect(x0, y0, width, height)
          .stroke({ pixelLine: true, color: 0x00ff00, alpha: 0.6 });
      }
    });

    ui.selectedEntity.listen(async () => {
      for (const cleanup of this.#listeners) cleanup();
      this.#listeners.length = 0;

      const selected = ui.selectedEntity.entities;
      if (!(selected.length === 1 && selected[0] instanceof EditorFacadeTilemap)) {
        this.#tilemap = undefined;
        return;
      }

      const tilemap = selected[0];
      if (tilemap === this.#tilemap) return;
      this.#tilemap = tilemap;
      await this.#loadAtlas(tilemap);
      this.#drawGrid();
      this.#drawSelected();

      const resVal = tilemap.values.get("resolution");
      if (resVal) {
        const onResolutionChanged = () => {
          this.#selectedTiles.clear();
          this.#drawGrid();
          this.#drawSelected();
        };

        resVal.onChanged(onResolutionChanged);
        this.#listeners.push(() => resVal.removeChangeListener(onResolutionChanged));
      }

      const atlasVal = tilemap.values.get("atlas");
      if (atlasVal) {
        const onAtlasChanged = async () => {
          await this.#loadAtlas(tilemap);

          this.#selectedTiles.clear();
          this.#updateSelectedTiles(tilemap);
          this.#drawGrid();
          this.#drawSelected();
        };

        atlasVal.onChanged(onAtlasChanged);
        this.#listeners.push(() => atlasVal.removeChangeListener(onAtlasChanged));
      }
    });

    app.canvas.addEventListener(
      "wheel",
      ev => {
        ev.preventDefault();

        if (!this.#isTouchpad) {
          this.#isTouchpad = isPinch(ev) || isTrackpadScroll(ev);
        }

        console.log(ev);
      },
      { passive: false },
    );

    app.canvas.addEventListener("mousedown", ev => {
      ev.preventDefault();
      if (ev.button === 1 /* MMB */) {
        this.#panning = { x: ev.clientX, y: ev.clientY };
        return;
      } else if (ev.button === 0 /* LMB */) {
        this.#dragging = {
          start: { x: ev.offsetX, y: ev.offsetY },
          end: { x: ev.offsetX, y: ev.offsetY },
        };
      }
    });

    app.canvas.addEventListener("mousemove", ev => {
      if (this.#panning) {
        const offset: IVector2 = {
          x: ev.clientX - this.#panning.x,
          y: ev.clientY - this.#panning.y,
        };

        this.#panning = { x: ev.clientX, y: ev.clientY };
        this.#pan.x += offset.x;
        this.#pan.y += offset.y;
        return;
      }

      if (this.#dragging) {
        this.#dragging.end = { x: ev.offsetX, y: ev.offsetY };
      }
    });

    app.canvas.addEventListener("mouseup", ev => {
      if (this.#panning !== undefined) this.#panning = undefined;

      if (this.#dragging !== undefined) {
        this.#drag.clear();
        const dragging = this.#dragging;
        this.#dragging = undefined;

        if (this.#tilemap) {
          const add = ev.ctrlKey || ev.metaKey;
          if (!add) this.#selectedTiles.clear();
          const selected = this.#areaToAtlasIds(dragging.start, dragging.end);
          if (selected.length === 0) {
            // ensure single clicks register correctly
            const id = this.#coordsToAtlasId(dragging.end);
            if (id !== undefined) selected.push(id);
          }

          for (const id of selected) this.#selectedTiles.add(id);
          this.#drawSelected();
          this.#updateSelectedTiles(this.#tilemap);
        }
      }
    });

    app.canvas.addEventListener("mouseout", () => {
      if (this.#panning !== undefined) this.#panning = undefined;
    });
  }

  async #loadAtlas(tilemap: EditorFacadeTilemap): Promise<void> {
    try {
      if (tilemap.atlas === "") throw new Error("empty texture");

      const url = this.game.resolveResource(tilemap.atlas);
      const texture = await PIXI.Assets.load({ src: url, data: { scaleMode: "linear" } });
      if (!(texture instanceof PIXI.Texture)) {
        throw new Error("not a texture");
      }

      this.#sprite.texture = texture;
    } catch {
      this.#sprite.texture = PIXI.Texture.EMPTY;
    }
  }

  #updateSelectedTiles(tilemap: EditorFacadeTilemap): void {
    if (this.#selectedTiles.size === 0 || tilemap.atlas === "") {
      tilemap.paletteId = [];
      tilemap.paletteRows = 1;
      tilemap.paletteCols = 1;
    } else {
      const texture = this.#sprite.texture;
      const res = tilemap.resolution;
      const cols = Math.floor(texture.width / res);

      let minX = Infinity;
      let minY = Infinity;
      let maxX = -Infinity;
      let maxY = -Infinity;

      const ids = [...this.#selectedTiles].toSorted();
      for (const id of ids) {
        const x = Math.floor(id % cols);
        const y = Math.floor(id / cols);

        if (x < minX) minX = x;
        if (y < minY) minY = y;
        if (x > maxX) maxX = x;
        if (y > maxY) maxY = y;
      }

      const w = maxX - minX + 1;
      const h = maxY - minY + 1;

      const palette: number[] = new Array(w * h).fill(-1);
      for (const id of ids) {
        const x = Math.floor(id % cols);
        const y = Math.floor(id / cols);

        const relX = x - minX;
        const relY = y - minY;
        palette[relY * w + relX] = id;
      }

      tilemap.paletteId = palette;
      tilemap.paletteCols = w;
      tilemap.paletteRows = h;
    }

    tilemap.paletteIdDirty = true;
  }

  #drawGrid(): void {
    this.#grid.clear();
    if (!this.#tilemap) return;

    const texture = this.#sprite.texture;
    const res = this.#tilemap.resolution;
    const rows = Math.floor(texture.height / res);
    const cols = Math.floor(texture.width / res);

    for (let i = 0; i <= cols; i++) {
      const x = i * res - texture.width / 2;
      this.#grid.moveTo(x, texture.height / -2).lineTo(x, texture.height / 2);
    }

    for (let i = 0; i <= rows; i++) {
      const y = i * res - texture.height / 2;
      this.#grid.moveTo(texture.width / -2, y).lineTo(texture.width / 2, y);
    }

    this.#grid.stroke({ pixelLine: true, color: 0xffffff, alpha: 0.85 });
  }

  #drawSelected(): void {
    this.#selected.clear();
    if (this.#selectedTiles.size === 0) return;
    if (!this.#tilemap) return;

    const texture = this.#sprite.texture;
    const res = this.#tilemap.resolution;
    const cols = Math.floor(texture.width / res);

    for (const id of this.#selectedTiles) {
      const x = Math.floor(id % cols);
      const y = Math.floor(id / cols);

      this.#selected.rect(x * res - texture.width / 2, y * res - texture.height / 2, res, res);
    }

    this.#selected
      .stroke({ pixelLine: true, color: 0x00ff00, alpha: 0.7 })
      .fill({ color: 0x00ff00, alpha: 0.2 });
  }

  #screenToWorld(screen: IVector2): IVector2 {
    const stage = this.#app.stage;
    return {
      x: (screen.x - stage.position.x) / this.#zoom,
      y: (screen.y - stage.position.y) / this.#zoom,
    };
  }

  #coordsToAtlasId(screen: IVector2, clamp = false): number | undefined {
    if (!this.#tilemap) return;
    const texture = this.#sprite.texture;

    const coords = this.#screenToWorld(screen);
    coords.x += texture.width / 2;
    coords.y += texture.height / 2;

    if (clamp) {
      if (coords.x < 0) coords.x = 0;
      if (coords.y < 0) coords.y = 0;
      if (coords.x >= texture.width) coords.x = texture.width - 1;
      if (coords.y >= texture.height) coords.y = texture.height - 1;
    }

    // out of bounds
    if (coords.x < 0 || coords.y < 0 || coords.x > texture.width || coords.y > texture.height) {
      return undefined;
    }

    const res = this.#tilemap.resolution;
    const x = Math.floor(coords.x / res);
    const y = Math.floor(coords.y / res);
    const w = Math.floor(texture.width / res);

    return y * w + x;
  }

  #areaToAtlasIds(p0: IVector2, p1: IVector2): number[] {
    if (p0.x === p1.x && p0.y === p1.y) {
      const id = this.#coordsToAtlasId(p0);
      if (!id) return [];
      else return [id];
    }

    const ids: number[] = [];
    if (!this.#tilemap) return ids;
    const texture = this.#sprite.texture;

    const x0 = Math.min(p0.x, p1.x);
    const x1 = Math.max(p0.x, p1.x);
    const y0 = Math.min(p0.y, p1.y);
    const y1 = Math.max(p0.y, p1.y);

    const w0 = this.#screenToWorld({ x: x0, y: y0 });
    w0.x += texture.width / 2;
    w0.y += texture.height / 2;

    const w1 = this.#screenToWorld({ x: x1, y: y1 });
    w1.x += texture.width / 2;
    w1.y += texture.height / 2;

    const area = new PIXI.Rectangle(w0.x, w0.y, w1.x - w0.x, w1.y - w0.y);
    const res = this.#tilemap.resolution;
    const w = Math.floor(texture.width / res);
    const h = Math.floor(texture.height / res);

    const rect = new PIXI.Rectangle(0, 0, 0, 0);
    for (let x = 0; x < w; x++) {
      for (let y = 0; y < h; y++) {
        rect.set(x * res, y * res, res, res);
        if (rect.containsRect(area) || area.intersects(rect)) {
          ids.push(y * w + x);
        }
      }
    }

    return ids;
  }

  resize() {
    this.#app.queueResize();
  }
}
