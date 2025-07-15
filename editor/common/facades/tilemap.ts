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
  atlasWidth: number = 1;
  atlasHeight: number = 1;

  constructor(ctx: EntityContext) {
    super(ctx);

    const onAtlasChanged = () => {
      this.#initializePalette();
    };

    const atlas = this.defineValue(EditorFacadeTilemap, "atlas", { type: TextureAdapter });
    const atlasWidth = this.defineValue(EditorFacadeTilemap, "atlasWidth");
    const atlasHeight = this.defineValue(EditorFacadeTilemap, "atlasHeight");

    atlas.onChanged(onAtlasChanged);
    atlasWidth.onChanged(onAtlasChanged);
    atlasHeight.onChanged(onAtlasChanged);
  }

  #initializePalette() {
    // clear existing palette
    for (const key of [...Object.keys(this.palette)]) {
      const idx = Number.parseInt(key, 10);
      if (Number.isNaN(idx)) continue;

      delete this.palette[idx];
    }

    for (let x = 0; x < this.atlasWidth; x++) {
      for (let y = 0; y < this.atlasHeight; y++) {
        this.palette[x * this.atlasWidth + y] = {
          type: "texture-slice",
          texture: this.atlas,
          x: x * this.resolution,
          y: y * this.resolution,
        };
      }
    }

    console.log(this.palette);
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

      const paletteId = 0; // TODO: get from ui
      this.setTile(x, y, left ? paletteId : undefined);
    });
  }
}
