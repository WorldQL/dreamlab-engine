import {
  BaseTilemap,
  Camera,
  Entity,
  EntityContext,
  GameRender,
  pointWorldToLocal,
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

  paletteId: number[] = [0];
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

      this.#updatePaletteXY();
    });
  }

  #updatePaletteXY(): void {
    const wpx = this.atlasImgWidth;
    const hpx = this.atlasImgHeight;
    if (!wpx || !hpx) return;

    const res = this.resolution || 1;
    const cols = Math.floor(wpx / res);
    const rows = Math.floor(hpx / res);
    const total = cols * rows;

    for (let idx = 0; idx < total; idx++) {
      const entry = this.palette[idx];
      if (!entry || entry.type !== "texture-slice") continue;

      const x = idx % cols;
      const y = Math.floor(idx / cols);
      entry.x = x * res;
      entry.y = y * res;
    }
  }

  #tooltip: PIXI.Graphics | undefined;
  #tooltipCols = 0;
  #tooltipRows = 0;

  #textureCache = new Map<string, PIXI.Texture>();
  async #loadTexture(tile: Parameters<BaseTilemap["loadTexture"]>[0]): Promise<PIXI.Texture> {
    if (!this.game.isClient()) throw new Error();
    const renderer = this.game.renderer.app.renderer;

    const cacheId = super.textureCacheId(tile);
    const cached = this.#textureCache.get(cacheId);
    if (cached) return cached;

    const base = await super.loadTexture(tile);
    const camera = Camera.getActive(this.game);
    const scaleMode = camera?.scaleFilterMode ?? "nearest";

    const texture = renderer.generateTexture({
      target: new PIXI.Sprite(base),
      resolution: this.resolution,
      textureSourceOptions: { scaleMode },
    });

    this.#textureCache.set(cacheId, texture);
    return texture;
  }

  async #buildTooltip(cols: number, rows: number) {
    if (!this.#tooltip) return;
    if (!this.paletteIdDirty) return;
    this.paletteIdDirty = false;

    this.#tooltipCols = cols;
    this.#tooltipRows = rows;

    const g = this.#tooltip;
    g.clear();

    for (let dy = 0; dy < rows; dy++) {
      for (let dx = 0; dx < cols; dx++) {
        const sy = rows - 1 - dy;
        const idx = sy * cols + dx;

        const tileId = this.paletteId[idx] ?? -1;
        if (tileId < 0) continue;

        const tile = this.palette[tileId];
        if (!tile || tile.type !== "texture-slice") continue;

        const texture = await this.#loadTexture(tile);
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

    // for (let dy = 0; dy < rows; dy++) {
    //   for (let dx = 0; dx < cols; dx++) {
    //     const tile = this.palette[this.paletteId[++idx]];
    //     if (!tile || tile.type !== "texture-slice") continue;

    //     const texture = await this.#loadTexture(tile);
    //     g.rect(dx - 0.5, -dy - 0.5, 1, 1)
    //       .fill({ texture, alpha: 0.7 })
    //       .stroke({
    //         pixelLine: true,
    //         color: 0xffffff,
    //         alpha: 0.75,
    //         width: 1,
    //       });
    //   }
    // }
  }

  onInitialize(): void {
    super.onInitialize();

    if (!this.game.isClient()) return;
    if (!this.container) return;
    const game = this.game;

    this.#tooltip = new PIXI.Graphics();
    this.#tooltip.alpha = 0;
    this.container.addChild(this.#tooltip);

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
