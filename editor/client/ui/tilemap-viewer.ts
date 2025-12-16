import {
  ClientGame,
  EntityDestroyed,
  IVector2,
  TilemapBatchUpdate,
  TilemapUpdate,
  Vector2,
} from "@dreamlab/engine";
import { element as elem } from "@dreamlab/ui";
import * as PIXI from "@dreamlab/vendor/pixi.ts";
import "npm:vanilla-colorful@^0.7.2/hex-color-picker.js";
import { EditorFacadeTilemap } from "../../common/facades/tilemap.ts";
import { icon, Pencil, Pipette, SquarePen, X } from "../_icons.tsx";
import { IconButton } from "../components/icon-button.ts";
import { InspectorUI } from "./inspector.ts";

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

  set visible(value: boolean) {
    if (!this.#app) return;
    if (value) this.#app.ticker.start();
    else this.#app.ticker.stop();
  }

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
  #hasValidAtlas = false;

  async setup(ui: InspectorUI, content: HTMLDivElement): Promise<void> {
    await this.#setupApp(ui, content);
    this.#setupOverlays(ui, content);
  }

  async #setupApp(ui: InspectorUI, content: HTMLDivElement): Promise<void> {
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
      if (!this.#hasValidAtlas) {
        this.#app.stage.position.set(this.#app.canvas.width / 2, this.#app.canvas.height / 2);
        this.#app.stage.scale.set(1);
        return;
      }

      const texture = this.#sprite.texture;
      const w = (texture.width * this.#zoom) / 2;
      const h = (texture.height * this.#zoom) / 2;
      this.#pan.x = Math.min(Math.max(this.#pan.x, -w), w);
      this.#pan.y = Math.min(Math.max(this.#pan.y, -h), h);

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
      this.#scanTilemapColors();

      if (this.#colorHistory.size > 0) {
        this.#setColorPainting(true);
      }

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

      const onEntityDestroyed = tilemap.on(EntityDestroyed, () => {
        ui.selectedEntity.entities = [];
      });
      this.#listeners.push(() => onEntityDestroyed.unsubscribe());

      const onTilemapBatchUpdate = tilemap.on(TilemapBatchUpdate, event => {
        if (tilemap.atlas === "") {
          for (const value of event.atlasIds) {
            if (typeof value === "number" && value !== undefined) {
              this.#colorHistory.add(value);
            }
          }
          this.#renderColorHistory();
        }
      });
      this.#listeners.push(() => onTilemapBatchUpdate.unsubscribe());

      const onTilemapUpdate = tilemap.on(TilemapUpdate, event => {
        if (tilemap.atlas === "" && event.info?.type === "color") {
          this.#colorHistory.add(event.info.color);
          this.#renderColorHistory();
        }
      });
      this.#listeners.push(() => onTilemapUpdate.unsubscribe());

      const onColorNamesChanged = () => {
        this.#renderColorHistory();
      };

      const colorNames = tilemap.values.get("colorNames");
      colorNames?.onChanged(onColorNamesChanged);
      this.#listeners.push(() => colorNames?.removeChangeListener(onColorNamesChanged));
    });

    app.canvas.addEventListener(
      "wheel",
      ev => {
        if (!this.#hasValidAtlas) return;
        ev.preventDefault();

        if (!this.#isTouchpad) {
          this.#isTouchpad = isPinch(ev) || isTrackpadScroll(ev);
        }

        if (this.#isTouchpad) {
          if (isPinch(ev)) {
            const zoomFac = Math.exp(-ev.deltaY * PINCH_SENS);
            this.#zoom = this.#zoom * zoomFac;
          } else {
            const pf = 1 / Math.min(Math.max(this.#zoom, 1), 4);
            this.#pan.x -= ev.deltaX * pf;
            this.#pan.y -= ev.deltaY * pf;
          }

          return;
        }

        const panMode = ev.ctrlKey || ev.metaKey;
        const notchY = ev.deltaMode === 1 ? ev.deltaY : ev.deltaY / 100;

        if (!panMode) {
          const zoomStep = Math.pow(1.1, -notchY);
          this.#zoom = this.#zoom * zoomStep;
        } else {
          const pf = 1 / Math.min(Math.max(this.#zoom, 1), 4);
          const factor = ev.deltaMode === 1 ? 16 : 1;
          this.#pan.x -= ev.deltaX * factor * pf;
          this.#pan.y -= ev.deltaY * factor * pf;
        }
      },
      { passive: false },
    );

    app.canvas.addEventListener("mousedown", ev => {
      if (!this.#hasValidAtlas) {
        if (this.#tilemap && ev.button === 0 /* LMB */ && this.#colorPaintingEnabled) {
          ev.preventDefault();
          this.#paintColorAtPoint({ x: ev.offsetX, y: ev.offsetY });
          this.#dragging = {
            start: { x: ev.offsetX, y: ev.offsetY },
            end: { x: ev.offsetX, y: ev.offsetY },
          };
        }
        return;
      }
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
      if (!this.#hasValidAtlas) {
        if (this.#tilemap && this.#dragging && this.#colorPaintingEnabled) {
          this.#paintColorAtPoint({ x: ev.offsetX, y: ev.offsetY });
        }
        return;
      }
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

        if (this.#tilemap && this.#hasValidAtlas) {
          const add = ev.ctrlKey || ev.metaKey;
          if (!add) this.#selectedTiles.clear();
          const selected = this.#areaToAtlasIds(dragging.start, dragging.end);
          if (selected.length === 0) {
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

  #overlay!: HTMLDivElement;
  #overlayLabel!: HTMLSpanElement;
  #overlayValue!: HTMLSpanElement;
  #noAtlasMessage!: HTMLDivElement;

  #colorPicker!: HTMLElement;
  #colorPickerContainer!: HTMLDivElement;
  #colorPickerPopup!: HTMLDivElement;
  #colorBox!: HTMLDivElement;
  #colorInput!: HTMLInputElement;
  #eyedropperButton!: IconButton;
  #colorInputs!: HTMLDivElement;
  #colorPaintToggle!: HTMLInputElement;
  #colorHistoryContainer!: HTMLDivElement;

  #selectedColor: number = 0xff0000;
  #colorPaintingEnabled: boolean = false;
  #colorHistory: Set<number> = new Set();

  #syncColorBrush(): void {
    if (!this.#tilemap) return;

    if (this.#colorPaintingEnabled) {
      this.#tilemap.paletteId = [this.#selectedColor];
      this.#tilemap.paletteCols = 1;
      this.#tilemap.paletteRows = 1;
    } else {
      this.#tilemap.paletteId = [];
      this.#tilemap.paletteCols = 1;
      this.#tilemap.paletteRows = 1;
    }
    this.#tilemap.paletteIdDirty = true;
  }

  #setupOverlays(_ui: InspectorUI, _content: HTMLDivElement): void {
    this.#overlayLabel = elem("span", {}, ["Selected Tile"]);
    this.#overlayValue = elem("span", {}, ["N/A"]);

    this.#overlay = elem("div", { id: "tile-overlay", style: { display: "none" } }, [
      icon(SquarePen),
      this.#overlayLabel,
      this.#overlayValue,
    ]);

    this.#colorBox = elem("div", { className: "color-box" }) as HTMLDivElement;
    const inputContainer = elem("div", { className: "color-input-container" });
    const hashLabel = elem("span", { className: "color-hash-label" }, ["#"]);
    this.#colorInput = elem("input", {
      type: "text",
      className: "color-input",
      placeholder: "FF0000",
      value: "ff0000",
    }) as HTMLInputElement;

    this.#eyedropperButton = new IconButton(Pipette, {
      className: "tilemap-eyedropper-button",
      title: "Pick color from screen",
    });

    const windowWithEyeDropper = window as typeof window & {
      EyeDropper?: {
        new (): {
          open(): Promise<{ sRGBHex: string }>;
        };
      };
    };

    if (windowWithEyeDropper.EyeDropper !== undefined) {
      inputContainer.append(hashLabel, this.#colorInput, this.#eyedropperButton);

      this.#eyedropperButton.addEventListener("click", async e => {
        e.stopPropagation();

        try {
          const eyeDropper = new windowWithEyeDropper.EyeDropper!();
          const result = await eyeDropper.open();

          const hexColor = result.sRGBHex;
          const colorValue = parseInt(hexColor.slice(1), 16);

          this.#selectedColor = colorValue;
          const picker = this.#colorPicker as HTMLElement & { color: string };
          picker.color = hexColor;
          this.#colorInput.value = hexColor.slice(1);
          this.#colorBox.style.backgroundColor = hexColor;
          this.#syncColorBrush();
        } catch (error) {
          console.log("Eyedropper was cancelled or failed:", error);
        }
      });
    } else {
      inputContainer.append(hashLabel, this.#colorInput);
    }

    const header = elem("div", { className: "color-picker-header" }, [
      elem("span", { className: "color-picker-title" }, ["Color Picker"]),
      elem("button", { className: "color-picker-close" }, [icon(X)]),
    ]);

    this.#colorPicker = elem("hex-color-picker");
    this.#colorPicker.style.width = "150px";
    this.#colorPicker.style.height = "150px";

    this.#colorPickerPopup = elem("div", { className: "color-picker-popup" }, [
      header,
      this.#colorPicker,
    ]) as HTMLDivElement;
    this.#colorPickerPopup.style.position = "fixed";
    this.#colorPickerPopup.style.zIndex = "1000";
    this.#colorPickerPopup.style.display = "none";

    this.#colorPickerContainer = elem("div", { className: "color-picker-container" }, [
      this.#colorBox,
      inputContainer,
      this.#colorPickerPopup,
    ]) as HTMLDivElement;

    this.#colorPaintToggle = elem("input", {
      type: "checkbox",
      id: "color-paint-toggle",
    }) as HTMLInputElement;

    const orSeparator = elem("div", { className: "or-separator" }, [elem("span", {}, ["or"])]);
    const toggleRow = elem("div", { className: "toggle-input-group" }, [
      this.#colorPaintToggle,
      elem("label", { htmlFor: "color-paint-toggle" }, ["Paint with color"]),
    ]);

    this.#colorHistoryContainer = elem("div", { className: "color-history-container" }, [
      elem("label", { className: "color-history-label" }, ["Recent colors:"]),
      elem("div", { className: "color-history-swatches" }),
    ]) as HTMLDivElement;

    this.#colorInputs = elem("div", { id: "color-inputs" }, [
      elem("div", { className: "color-input-group" }, [
        elem("label", {}, ["Color:"]),
        this.#colorPickerContainer,
      ]),
      this.#colorHistoryContainer,
    ]) as HTMLDivElement;

    this.#noAtlasMessage = elem("div", { id: "no-atlas-message", style: { display: "none" } }, [
      elem("div", { className: "message-content" }, [
        elem("h3", {}, ["No Atlas Texture"]),
        elem("p", {}, [
          "Add an atlas texture to the tilemap in the properties panel to start painting tiles.",
        ]),
        orSeparator,
        toggleRow,
        this.#colorInputs,
      ]),
    ]);

    this.container.appendChild(
      elem("div", { id: "tilemap-overlays" }, [this.#overlay, this.#noAtlasMessage]),
    );
    this.#setupColorPaintEvents();
  }

  #setColorPainting(on: boolean): void {
    this.#colorPaintingEnabled = !!on;
    if (this.#colorPaintToggle) this.#colorPaintToggle.checked = this.#colorPaintingEnabled;
    if (this.#noAtlasMessage) {
      if (this.#colorPaintingEnabled) this.#noAtlasMessage.dataset.colorPainting = "";
      else delete this.#noAtlasMessage.dataset.colorPainting;
    }

    if (this.#colorPaintingEnabled) {
      this.#scanTilemapColors();
      this.#renderColorHistory();
    }
    this.#syncColorBrush();
  }

  #scanTilemapColors(): void {
    if (!this.#tilemap) return;

    const usedColors = (
      this.#tilemap as EditorFacadeTilemap & { getUsedColors(): number[] }
    ).getUsedColors();

    for (const color of usedColors) {
      this.#colorHistory.add(color);
    }
  }

  #setupColorPaintEvents(): void {
    this.#colorBox.addEventListener("click", e => {
      const noAtlasMessage = this.#noAtlasMessage;
      if (!noAtlasMessage) return;

      if (this.#colorPickerPopup.style.display === "block") {
        this.#colorPickerPopup.style.display = "none";
        return;
      }

      this.#colorPickerPopup.style.visibility = "hidden";
      this.#colorPickerPopup.style.display = "block";

      const popupRect = this.#colorPickerPopup.getBoundingClientRect();
      const popupH = popupRect.height;

      const boxRect = this.#colorBox.getBoundingClientRect();
      const spaceBelow = window.innerHeight - boxRect.bottom;
      const spaceAbove = boxRect.top;

      let finalTop: number;
      if (spaceBelow < popupH && spaceAbove >= popupH) {
        finalTop = boxRect.top - popupH - 4;
      } else if (spaceBelow < popupH && spaceAbove < popupH) {
        finalTop = Math.max(10, window.innerHeight - popupH - 10);
      } else {
        finalTop = boxRect.bottom + 4;
      }

      const finalLeft = Math.max(
        10,
        Math.min(boxRect.left - 75, window.innerWidth - popupRect.width - 10),
      );

      this.#colorPickerPopup.style.top = finalTop + "px";
      this.#colorPickerPopup.style.left = finalLeft + "px";
      this.#colorPickerPopup.style.visibility = "";
      this.#colorPickerPopup.style.display = "block";

      e.stopPropagation();
    });

    document.addEventListener("pointerdown", e => {
      if (!this.#colorPickerPopup.contains(e.target as Node) && e.target !== this.#colorBox) {
        this.#colorPickerPopup.style.display = "none";
      }
    });

    const closeButton = this.#colorPickerPopup.querySelector(
      ".color-picker-close",
    ) as HTMLButtonElement;
    closeButton.addEventListener("click", e => {
      this.#colorPickerPopup.style.display = "none";
      e.stopPropagation();
    });

    this.#colorPicker.addEventListener("color-changed", () => {
      const picker = this.#colorPicker as HTMLElement & { color: string };
      const color = picker.color;
      this.#selectedColor = parseInt(color.slice(1), 16);
      this.#colorInput.value = color.slice(1);
      this.#colorBox.style.backgroundColor = color;
      this.#syncColorBrush();
    });

    this.#colorInput.addEventListener("input", () => {
      const value = this.#colorInput.value;
      const fullValue = "#" + value;

      // TODO: allow alpha in color picker, if possible? - alpha breaks paint preview and throws an error
      if (/^([0-9A-Fa-f]{3}|[0-9A-Fa-f]{6})$/.test(value)) {
        const picker = this.#colorPicker as HTMLElement & { color: string };
        picker.color = fullValue;
        this.#selectedColor = parseInt(value, 16);
        this.#colorBox.style.backgroundColor = fullValue;
        this.#colorInput.classList.remove("invalid");
        this.#syncColorBrush();
      } else {
        this.#colorInput.classList.add("invalid");
      }
    });

    this.#colorPaintToggle.addEventListener("change", e => {
      const on = (e.target as HTMLInputElement).checked;
      this.#setColorPainting(on);
    });

    const initialColor = "#ff0000";
    const picker = this.#colorPicker as HTMLElement & { color: string };
    picker.color = initialColor;
    this.#colorBox.style.backgroundColor = initialColor;
    this.#colorInput.value = "ff0000";
  }

  async #loadAtlas(tilemap: EditorFacadeTilemap): Promise<void> {
    try {
      if (tilemap.atlas === "") throw new Error("empty texture");

      const url = this.game.resolveResource(tilemap.atlas);
      const texture = await PIXI.Assets.load({ src: url, data: { scaleMode: "nearest" } });
      if (!(texture instanceof PIXI.Texture)) {
        throw new Error("not a texture");
      }

      if (this.#sprite.texture === texture) return;
      this.#sprite.texture = texture;
      this.#hasValidAtlas = true;
      this.#noAtlasMessage.style.display = "none";
      this.#setColorPainting(false);

      const canvas = this.#app.canvas;
      const pad = 1.1;
      const w = canvas.width / (texture.width * pad);
      const h = canvas.height / (texture.height * pad);
      this.#pan.x = 0;
      this.#pan.y = 0;
      this.#zoom = Math.min(w, h);
    } catch {
      this.#sprite.texture = PIXI.Texture.EMPTY;
      this.#hasValidAtlas = false;
      this.#selectedTiles.clear();
      this.#drawGrid();
      this.#drawSelected();
      this.#noAtlasMessage.style.display = "flex";
    }
  }

  #updateSelectedTiles(tilemap: EditorFacadeTilemap): void {
    if (this.#selectedTiles.size === 0 || tilemap.atlas === "") {
      tilemap.paletteId = [];
      tilemap.paletteRows = 1;
      tilemap.paletteCols = 1;

      this.#overlay.style.display = "none";
      this.#overlayLabel.textContent = "Selected Tile";
      this.#overlayValue.textContent = "N/A";
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

      this.#overlay.style.display = palette.length > 0 ? "" : "none";
      this.#overlayLabel.textContent = palette.length > 1 ? "Selected Tiles" : "Selected Tile";
      this.#overlayValue.textContent =
        palette.length > 5 ? `${palette.length}\u00d7 Tiles` : palette.join(" ");
    }

    tilemap.paletteIdDirty = true;
  }

  #drawGrid(): void {
    this.#grid.clear();
    if (!this.#tilemap || !this.#hasValidAtlas) return;

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
    if (!this.#tilemap || !this.#hasValidAtlas) return;

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

  #paintColorAtPoint(screenPos: IVector2): void {
    if (!this.#tilemap) return;

    const tileCoords = this.#screenToTileCoords(screenPos);
    if (!tileCoords) return;

    this.#tilemap.setColor(tileCoords.x, tileCoords.y, this.#selectedColor);
  }

  #screenToTileCoords(screenPos: IVector2): IVector2 | undefined {
    if (!this.#tilemap) return undefined;

    let world: IVector2;
    if (this.#hasValidAtlas) {
      world = this.#screenToWorld(screenPos);
    } else {
      const stage = this.#app.stage;
      world = {
        x: screenPos.x - stage.position.x,
        y: screenPos.y - stage.position.y,
      };
    }

    const tileSize = this.#tilemap.resolution;

    const x = Math.floor(world.x / tileSize);
    const y = Math.floor(-world.y / tileSize);

    return { x, y };
  }

  #renderColorHistory(): void {
    const swatchesContainer = this.#colorHistoryContainer.querySelector(
      ".color-history-swatches",
    ) as HTMLDivElement;
    if (!swatchesContainer) return;

    swatchesContainer.innerHTML = "";

    const colors = Array.from(this.#colorHistory);

    if (colors.length === 0) {
      this.#colorHistoryContainer.style.display = "none";
      return;
    }

    this.#colorHistoryContainer.style.display = "";

    for (const color of colors) {
      const hexColor = "#" + color.toString(16).padStart(6, "0");
      const name = this.#tilemap?.colorNames?.[color];

      const labelSpan = elem("span", { dataset: name ? undefined : { unnamed: "" } }, [
        name ?? hexColor,
      ]);

      const renameButton = elem("button", { title: "Rename" }, [icon(Pencil)]);

      const colorButton = elem("button", {
        type: "button",
        className: "color",
        title: hexColor,
      });

      const swatch = elem(
        "div",
        {
          className: "color-swatch",
          style: { "--swatch-color": hexColor },
          dataset: color === this.#selectedColor ? { selected: "" } : undefined,
        },
        [colorButton, elem("div", { className: "label" }, [labelSpan, renameButton])],
      );

      colorButton.addEventListener("click", () => {
        this.#selectColorFromHistory(color);
      });

      const startRename = (): void => {
        if (labelSpan.isContentEditable) return;
        labelSpan.contentEditable = "plaintext-only";
        if (labelSpan.dataset.unnamed !== undefined) {
          labelSpan.textContent = "";
          delete labelSpan.dataset.unnamed;
        }

        labelSpan.focus();
        window.getSelection()?.selectAllChildren(labelSpan);
      };

      const endRename = (cancel = false): void => {
        if (!labelSpan.isContentEditable) return;
        labelSpan.contentEditable = "false";

        const label = labelSpan.textContent;
        if (!cancel && this.#tilemap) {
          if (label) this.#tilemap.colorNames[color] = label;
          else delete this.#tilemap.colorNames[color];
        }

        this.#renderColorHistory();
      };

      labelSpan.addEventListener("keydown", ev => {
        if (!labelSpan.isContentEditable) return;
        if (ev.key === "Enter") {
          ev.preventDefault();
          endRename();
          return;
        }

        if (ev.key === "Escape") {
          ev.preventDefault();
          ev.stopPropagation();
          endRename(true);
          return;
        }
      });

      labelSpan.addEventListener("blur", () => {
        if (!labelSpan.isContentEditable) return;
        endRename();
      });

      labelSpan.addEventListener("dblclick", ev => {
        ev.preventDefault();
        startRename();
      });
      renameButton.addEventListener("click", ev => {
        if (ev.button === 0) startRename();
      });

      swatchesContainer.appendChild(swatch);
    }
  }

  #selectColorFromHistory(color: number): void {
    this.#selectedColor = color;
    const hexColor = "#" + color.toString(16).padStart(6, "0");

    const picker = this.#colorPicker as HTMLElement & { color: string };
    picker.color = hexColor;
    this.#colorInput.value = hexColor.slice(1);
    this.#colorBox.style.backgroundColor = hexColor;

    this.#renderColorHistory();
    this.#syncColorBrush();
  }

  resize() {
    this.#app.queueResize();
  }
}
