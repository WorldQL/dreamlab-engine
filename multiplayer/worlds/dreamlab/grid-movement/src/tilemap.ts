import { Behavior, Rng, Tilemap, value, Vector2, Vector2Adapter } from "@dreamlab/engine";
import { createNoise2D } from "npm:simplex-noise";
import { Colors } from "../lib/colors.ts";

export default class GenerateTilemap extends Behavior {
  #tilemap = this.entity.cast(Tilemap);

  @value()
  seed: number = 0;

  @value({ type: Vector2Adapter })
  halfExtents: Vector2 = new Vector2(50, 50);

  @value({ type: Vector2Adapter })
  safeZone: Vector2 = new Vector2(1, 1);

  onInitialize(): void {
    const prng = Rng.Seeded(BigInt(this.seed));
    const noise = createNoise2D(prng);

    for (let x = -this.halfExtents.x; x < this.halfExtents.x; x++) {
      for (let y = -this.halfExtents.y; y < this.halfExtents.y; y++) {
        if (
          x >= -this.safeZone.x &&
          x <= this.safeZone.x &&
          y >= -this.safeZone.y &&
          y <= this.safeZone.y
        ) {
          continue;
        }

        const val = noise(x, y);
        const rng = (val + 1) / 2;

        if (rng <= 0.3) this.#tilemap.setColor(x, y, Colors.Water);
        else if (rng <= 0.4) this.#tilemap.setColor(x, y, Colors.Sand);
        else if (rng <= 0.8) this.#tilemap.setColor(x, y, Colors.Grass);
        else this.#tilemap.setColor(x, y, Colors.Wall);
      }
    }
  }
}
