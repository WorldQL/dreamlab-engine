import { Behavior, Empty, TilingSprite, Vector2 } from "@dreamlab/engine";
import Dropzone from "./dropzone.ts";

export default class Board extends Behavior {
  size: number = 10;
  tiles: number = 10;

  onInitialize(): void {
    this.defineValues(Board, "size", "tiles");

    // Only spawn board children on server
    if (!this.game.isServer()) return;
    const sprite = this.entity.spawn({
      type: TilingSprite,
      name: "_Sprite",
      values: {
        width: this.size,
        height: this.size,
        tileScale: Vector2.splat(1 / (this.tiles / 2)),
        texture: "res://assets/board.png",
      },
    });

    const sizeValue = this.values.get("size");
    sizeValue?.onChanged(() => {
      sprite.width = this.size;
      sprite.height = this.size;

      this.#spawnDropzones();
    });

    const tilesValue = this.values.get("tiles");
    tilesValue?.onChanged(() => {
      sprite.tileScale = Vector2.splat(1 / (this.tiles / 2));

      this.#spawnDropzones();
    });

    this.#spawnDropzones();
  }

  #spawnDropzones() {
    this.entity.children.forEach(e => {
      if (e.behaviors.some(b => b instanceof Dropzone)) e.destroy();
    });

    const tileSize = this.size / this.tiles;
    for (let x = 0; x < this.tiles; x++) {
      for (let y = 0; y < this.tiles; y++) {
        const position = new Vector2({
          x: x * tileSize - this.size / 2 + tileSize / 2,
          y: y * tileSize - this.size / 2 + tileSize / 2,
        });

        this.entity.spawn({
          type: Empty,
          name: "Dropzone",
          behaviors: [{ type: Dropzone, values: { width: tileSize, height: tileSize } }],
          transform: { position },
        });
      }
    }
  }
}
