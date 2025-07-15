import {
  BaseTilemap,
  Entity,
  EntityContext,
  GameRender,
  TextureAdapter,
  Tilemap,
} from "@dreamlab/engine";
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

  onInitialize(): void {
    super.onInitialize();

    if (!this.game.isClient()) return;
    const game = this.game;

    this.#initializePalette();
    this.listen(this.game, GameRender, () => {
      const svc = SelectedEntityService.serviceForGame(game);
      if (!svc?.entities.includes(this)) return;

      const world = this.inputs.cursor.world;
      if (!world) return;

      const left = this.inputs.getKey("MouseLeft");
      const right = this.inputs.getKey("MouseRight");
      if (!left && !right) return;

      const { x, y } = this.getTileCoordinatesAtPoint(world);

      this.setTile(x, y, left ? this.paletteId[0] : undefined);
    });
  }
}
