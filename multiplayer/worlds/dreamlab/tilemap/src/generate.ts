import { Behavior, Rng, Tilemap, syncedValue } from "@dreamlab/engine";
import { sample } from "jsr:@std/random@0.1.2";
import { createNoise2D } from "npm:simplex-noise";

export default class Generate extends Behavior {
  #tilemap = this.entity.cast(Tilemap);

  @syncedValue()
  seed: number = 0;

  fillPalette(): void {
    for (let idx = 0; idx < 34; idx++) {
      this.#tilemap.palette[idx] = {
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

  generateMap(): void {
    const SIZE = 50;
    const rng = Rng.Seeded(BigInt(this.seed));
    const noise = createNoise2D(rng);

    const fn = (x: number, y: number): number => {
      const value = noise(x, y);
      const prng = Rng.Seeded(BigInt(y * SIZE + x));

      if (value < 0.05) {
        return 0;
      } else if (value < 0.6) {
        // grass
        return sample(Generate.#GRASS_TILES, { prng })!;
      } else {
        // flowers
        return sample(Generate.#FLOWER_TILES, { prng })!;
      }
    };

    for (let x = 0; x < SIZE; x++) {
      for (let y = 0; y < SIZE; y++) {
        const paletteId = fn(x, y);
        this.#tilemap.setTile(x, y, paletteId);
      }
    }
  }

  onInitialize() {
    if (!this.game.isServer()) return;

    const seed = this.values.get("seed");
    seed?.onChanged(() => {
      this.generateMap();
    });

    this.fillPalette();
    this.generateMap();
  }
}
