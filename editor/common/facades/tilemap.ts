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

  constructor(ctx: EntityContext) {
    super(ctx);

    const atlas = this.defineValue(EditorFacadeTilemap, "atlas", { type: TextureAdapter });
    atlas.onChanged(() => {
      this.#initializePalette();
    });
  }

  async #initializePalette() {
    // clear existing palette
    for (const key of [...Object.keys(this.palette)]) {
      const idx = Number.parseInt(key, 10);
      if (Number.isNaN(idx)) continue;

      delete this.palette[idx];
    }

    const img = new Image();
    img.src = this.game.resolveResource(this.atlas);
    await img.decode();

    const atlasWidth = Math.floor(img.naturalWidth / this.resolution);
    const atlasHeight = Math.floor(img.naturalHeight / this.resolution);

    for (let x = 0; x < atlasWidth; x++) {
      for (let y = 0; y < atlasHeight; y++) {
        this.palette[x * atlasWidth + y] = {
          type: "texture-slice",
          texture: this.atlas,
          x: x * this.resolution,
          y: y * this.resolution,
        };
      }
    }
  }

  #tooltipCtx = new PIXI.GraphicsContext().rect(-0.5, -0.5, 1, 1).stroke({ pixelLine: true });
  #tooltip: PIXI.Graphics | undefined;

  onInitialize(): void {
    super.onInitialize();

    if (!this.game.isClient()) return;
    if (!this.container) return;
    const game = this.game;

    this.#tooltip = new PIXI.Graphics(this.#tooltipCtx);
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

      const left = this.inputs.getKey("MouseLeft");
      const right = this.inputs.getKey("MouseRight");
      if (!left && !right) return;

      const { x, y } = this.getTileCoordinatesAtPoint(world);
      this.setTile(x, y, left ? this.paletteId[0] : undefined);
    });
  }
}
