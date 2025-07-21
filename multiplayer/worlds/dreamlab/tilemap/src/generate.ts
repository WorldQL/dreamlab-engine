import { Behavior, Rng, syncedValue, Tilemap } from "@dreamlab/engine";
import { sample } from "jsr:@std/random@0.1.2";
import { createNoise2D, NoiseFunction2D } from "npm:simplex-noise";

export default class Generate extends Behavior {
  #tilemap = this.entity.cast(Tilemap);

  @syncedValue()
  seed: number = 0;

  fillPalette(): void {
    for (let idx = 0; idx < 34; idx++) {
      this.#tilemap.paletteOverrides[idx] = {
        type: "spritesheet",
        spritesheet: "res://assets/grass.json",
        frame: idx,
      };
    }
  }

  clearData(): void {
    this.#tilemap.clearTiles();
  }

  // prettier-ignore
  static readonly #GRASS_TILES: readonly number[] = [1, 2, 3, 8, 9, 10, 11, 16, 17, 18, 19, 24, 25, 26, 27] as const;
  // prettier-ignore
  static readonly #FLOWER_TILES: readonly number[] = [4, 5, 6, 7, 12, 13, 14, 20, 21, 22, 23, 28, 29, 30, 31] as const;

  #noise1!: NoiseFunction2D; // tile type
  #noise2!: NoiseFunction2D; // tile

  #setRng(): void {
    const rng1 = Rng.Seeded(BigInt(this.seed));
    const rng2 = Rng.Seeded(BigInt(this.seed) ^ 478953n);
    this.#noise1 = createNoise2D(rng1);
    this.#noise2 = createNoise2D(rng2);
  }

  #getTile(x: number, y: number): number {
    const value = this.#noise1(x, y);
    const prng = () => this.#noise2(x, y);

    if (value < 0.05) {
      return 0;
    } else if (value < 0.6) {
      // grass
      return sample(Generate.#GRASS_TILES, { prng })!;
    } else {
      // flowers
      return sample(Generate.#FLOWER_TILES, { prng })!;
    }
  }

  generateMap(size = 50): void {
    for (let x = 0; x < size; x++) {
      for (let y = 0; y < size; y++) {
        const paletteId = this.#getTile(x, y);
        this.#tilemap.setTile(x, y, paletteId);
      }
    }
  }

  onInitialize() {
    const seed = this.values.get("seed");
    seed?.onChanged(() => {
      this.#setRng();
      if (this.game.isServer()) this.generateMap();
    });

    this.#setRng();

    if (this.game.isServer()) {
      this.fillPalette();
      this.generateMap();
    }
  }

  onFrame(): void {
    if (!this.game.isClient()) return;

    const world = this.inputs.cursor.world;
    if (!world) return;

    const left = this.inputs.getKey("MouseLeft");
    const right = this.inputs.getKey("MouseRight");
    if (!left && !right) return;

    const tile = this.#tilemap.getTileAtPoint(world);
    if (!tile) return;

    const id = left ? 33 : this.#getTile(tile.x, tile.y);
    this.#tilemap.setTile(tile.x, tile.y, id);
  }
}
