import {
  BaseTilemap,
  Entity,
  EntityContext,
  GameRender,
  pointWorldToLocal,
  TextureAdapter,
  Tilemap,
} from "@dreamlab/engine";
import * as PIXI from "@dreamlab/vendor/pixi.ts";
import { SelectedEntityService } from "../../client/ui/selected-entity.ts";
import { Facades } from "./manager.ts";

export class EditorFacadeTilemap extends BaseTilemap {
  static {
    Entity.registerType(this, "@editor");
    Facades.register(Tilemap, this);
  }

  atlas: string = "";
  paletteId: number[] = [0];
  paletteCols = 1;
  paletteRows = 1;

  constructor(ctx: EntityContext) {
    super(ctx);

    const atlas = this.defineValue(EditorFacadeTilemap, "atlas", { type: TextureAdapter });
    atlas.onChanged(() => {
      this.#initializePalette();
    });
  }

  async #initializePalette() {
    for (const key of [...Object.keys(this.palette)]) {
      const idx = Number.parseInt(key, 10);
      if (Number.isNaN(idx)) continue;
      delete this.palette[idx];
    }

    if (!this.atlas) return;

    const img = new Image();
    img.src = this.game.resolveResource(this.atlas);
    await img.decode();

    const atlasWidth = Math.floor(img.naturalWidth / this.resolution);
    const atlasHeight = Math.floor(img.naturalHeight / this.resolution);

    for (let x = 0; x < atlasWidth; x++) {
      for (let y = 0; y < atlasHeight; y++) {
        const idx = y * atlasWidth + x;
        this.palette[idx] = {
          type: "texture-slice",
          texture: this.atlas,
          x: x * this.resolution,
          y: y * this.resolution,
        };
      }
    }
  }

  #tooltip: PIXI.Graphics | undefined;
  #tooltipCols = 0;
  #tooltipRows = 0;

  #buildTooltip(cols: number, rows: number) {
    if (!this.#tooltip) return;
    if (this.#tooltipCols === cols && this.#tooltipRows === rows) return;

    this.#tooltipCols = cols;
    this.#tooltipRows = rows;

    const g = this.#tooltip;
    g.clear();

    for (let dy = 0; dy < rows; dy++) {
      for (let dx = 0; dx < cols; dx++) {
        g.rect(dx - 0.5, -dy - 0.5, 1, 1);
      }
    }

    g.stroke({
      pixelLine: true,
      color: 0xffffff,
      alpha: 0.75,
      width: 1,
    });
  }

  onInitialize(): void {
    super.onInitialize();

    if (!this.game.isClient()) return;
    if (!this.container) return;
    const game = this.game;

    this.#tooltip = new PIXI.Graphics();
    this.#tooltip.alpha = 0;
    this.container.addChild(this.#tooltip);

    this.#initializePalette();

    this.listen(this.game, GameRender, () => {
      if (!this.#tooltip) return;

      const world = this.inputs.cursor.world;
      const svc = SelectedEntityService.serviceForGame(game);
      if (!svc?.entities.includes(this) || !world) {
        this.#tooltip.alpha = 0;
        return;
      }

      this.#tooltip.alpha = 1;
      const local = pointWorldToLocal(this.globalTransform, world);
      this.#tooltip.position.set(Math.floor(local.x + 0.5), Math.floor(-local.y + 0.5));

      const cols = Math.max(1, this.paletteCols | 0);
      const rows = Math.max(1, this.paletteRows | 0);
      this.#buildTooltip(cols, rows);

      const left = this.inputs.getKey("MouseLeft");
      const right = this.inputs.getKey("MouseRight");
      if (!left && !right) return;

      const { x, y } = this.getTileCoordinatesAtPoint(world);

      for (let dy = 0; dy < rows; dy++) {
        for (let dx = 0; dx < cols; dx++) {
          const sy = rows - 1 - dy;
          const idx = sy * cols + dx;
          const tileId = this.paletteId[idx] ?? -1;
          if (tileId < 0) continue;

          this.setTile(x + dx, y + dy, left ? tileId : undefined);
        }
      }
    });
  }
}
