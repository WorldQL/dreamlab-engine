import { Behavior, Rng, Tilemap, value, Vector2, Vector2Adapter } from "@dreamlab/engine";

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

        const wall = prng() > 0.8;
        if (wall) this.#tilemap.setColor(x, y, 0x555555);
      }
    }
  }
}
