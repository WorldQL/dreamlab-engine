import {
  BaseTilemap,
  Entity,
  EntityContext,
  GameRender,
  MouseDown,
  MouseMove,
  MouseUp,
  pointWorldToLocal,
  Tilemap,
  Vector2,
} from "@dreamlab/engine";
import * as PIXI from "@dreamlab/vendor/pixi.ts";
import { SelectedEntityService } from "../../client/ui/selected-entity.ts";
import { UndoRedoManager, UndoRedoOperation } from "../../client/undo-redo.ts";
import { Facades } from "./manager.ts";

export class EditorFacadeTilemap extends BaseTilemap {
  static {
    Entity.registerType(this, "@editor");
    Facades.register(Tilemap, this);
  }

  paletteId: number[] = [];
  paletteCols = 1;
  paletteRows = 1;
  paletteIdDirty: boolean = true;

  constructor(ctx: EntityContext) {
    super(ctx);

    const resValue = this.values.get("resolution");
    resValue?.onChanged?.(() => {
      for (const texture of this.#textureCache.values()) texture.destroy(true);
      this.#textureCache.clear();

      this.paletteIdDirty = true;
      const cols = Math.max(1, this.paletteCols | 0);
      const rows = Math.max(1, this.paletteRows | 0);
      this.#buildTooltip(cols, rows);

      // this.#updatePaletteXY();
    });
  }

  // #updatePaletteXY(): void {
  //   const wpx = this.atlasImgWidth;
  //   const hpx = this.atlasImgHeight;
  //   if (!wpx || !hpx) return;

  //   const res = this.resolution || 1;
  //   const cols = Math.floor(wpx / res);
  //   const rows = Math.floor(hpx / res);
  //   const total = cols * rows;

  //   for (let idx = 0; idx < total; idx++) {
  //     const entry = this.palette[idx];
  //     if (!entry || entry.type !== "texture-slice") continue;

  //     const x = idx % cols;
  //     const y = Math.floor(idx / cols);
  //     entry.x = x * res;
  //     entry.y = y * res;
  //   }
  // }

  #tooltip: PIXI.Graphics | undefined;
  #tooltipCols = 0;
  #tooltipRows = 0;

  #textureCache = new Map<string, PIXI.Texture>();
  async #loadTexture(atlasId: number): Promise<PIXI.Texture> {
    if (!this.game.isClient()) throw new Error();
    const renderer = this.game.renderer.app.renderer;

    const cacheId = `${this.atlas}@${this.resolution}@${atlasId}`;
    const cached = this.#textureCache.get(cacheId);
    if (cached) return cached;

    const url = this.game.resolveResource(this.atlas);
    const texture = await PIXI.Assets.load({ src: url, data: { scaleMode: "nearest" } });
    if (!(texture instanceof PIXI.Texture)) throw new Error("invalid texture");

    this.#tooltipCols = Math.floor(texture.width / this.resolution);
    this.#tooltipRows = Math.floor(texture.height / this.resolution);

    const x = atlasId % this.#tooltipCols;
    const y = Math.floor(atlasId / this.#tooltipCols);
    const frameX = x * this.resolution;
    const frameY = y * this.resolution;

    const frame = new PIXI.Rectangle(frameX, frameY, this.resolution, this.resolution);
    const slice = new PIXI.Texture({ source: texture.source, frame });

    const final = renderer.generateTexture({
      target: new PIXI.Sprite(slice),
      textureSourceOptions: { scaleMode: "nearest" },
    });

    this.#textureCache.set(cacheId, final);
    return final;
  }

  async #buildTooltip(cols: number, rows: number) {
    if (!this.#tooltip) return;
    if (!this.paletteIdDirty) return;
    this.paletteIdDirty = false;

    this.#tooltipCols = cols;
    this.#tooltipRows = rows;

    const g = this.#tooltip;
    g.clear();

    if (this.paletteId.length === 0) return;

    for (let dy = 0; dy < rows; dy++) {
      for (let dx = 0; dx < cols; dx++) {
        const sy = rows - 1 - dy;
        const idx = sy * cols + dx;

        const tileId = this.paletteId[idx] ?? -1;
        if (tileId < 0) continue;

        const texture = await this.#loadTexture(tileId);
        g.rect(dx - 0.5, -dy - 0.5, 1, 1)
          .fill({ texture, alpha: 0.7 })
          .stroke({
            pixelLine: true,
            color: 0xffffff,
            alpha: 0.75,
            width: 1,
          });
      }
    }
  }

  onInitialize(): void {
    super.onInitialize();

    if (!this.game.isClient()) return;
    if (!this.container) return;

    this.#tooltip = new PIXI.Graphics();
    this.#tooltip.alpha = 0;
    this.container.addChild(this.#tooltip);

    let paintOperations: (UndoRedoOperation & { t: "modify-tilemap" })[] = [];
    const paint = (world: Vector2) => {
      if (this.paletteId.length === 0) return;

      const left = this.inputs.getKey("MouseLeft");
      const right = this.inputs.getKey("MouseRight");
      if (!left && !right) return;

      if (!this.shouldPaint()) {
        return;
      }

      const cols = Math.max(1, this.paletteCols | 0);
      const rows = Math.max(1, this.paletteRows | 0);
      const { x, y } = this.getTileCoordinatesAtPoint(world);

      for (let dy = 0; dy < rows; dy++) {
        for (let dx = 0; dx < cols; dx++) {
          const sy = rows - 1 - dy;
          const idx = sy * cols + dx;
          const tileId = this.paletteId[idx] ?? -1;
          if (tileId < 0) continue;

          const tileX = x + dx,
            tileY = y + dy;
          const prevId = this.getTile(tileX, tileY);
          const newId = left ? tileId : undefined;
          if (prevId !== newId) {
            this.setTile(tileX, tileY, newId);
            // TODO: it would be nice to build up a compound undo/redo op and then commit
            // it on mouseup
            paintOperations.push({
              t: "modify-tilemap",
              tilemapRef: this.ref,
              x: tileX,
              y: tileY,
              prevId,
              newId,
            });
          }
        }
      }
    };

    this.listen(this.game.inputs, MouseDown, ({ cursor }) => {
      paintOperations = [];
      paint(cursor.world);
    });
    this.listen(this.game.inputs, MouseUp, () => {
      if (paintOperations.length > 0) {
        UndoRedoManager._.push({ t: "compound", ops: paintOperations });
        paintOperations = [];
      }
    });
    this.listen(this.game.inputs, MouseMove, ({ cursor }) => {
      paint(cursor.world);
    });

    this.listen(this.game, GameRender, () => {
      if (!this.#tooltip) return;

      const world = this.inputs.cursor.world;
      if (!this.shouldPaint() || !world) {
        this.#tooltip.alpha = 0;
        return;
      }

      this.#tooltip.alpha = 1;
      const local = pointWorldToLocal(this.globalTransform, world);
      this.#tooltip.position.set(Math.floor(local.x + 0.5), Math.floor(-local.y + 0.5));

      const cols = Math.max(1, this.paletteCols | 0);
      const rows = Math.max(1, this.paletteRows | 0);
      this.#buildTooltip(cols, rows);
    });
  }

  shouldPaint(): boolean {
    if (this.game.isServer()) return false;
    const svc = SelectedEntityService.serviceForGame(this.game);
    const selected = svc?.entities?.includes(this) ?? false;

    // TODO: need inspector ui root instead of document (prevent crosstalk between edit and play)
    const tilemapTabOpen =
      document.querySelector("[data-tab-id=tilemap][data-active]") !== null;
    return selected && tilemapTabOpen;
  }
}
