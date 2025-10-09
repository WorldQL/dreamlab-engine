import {
  ActionPressed,
  Behavior,
  Collider,
  ColoredSquare,
  Entity,
  EntityRef,
  Rng,
  StandardUniform,
  value,
  Vector2,
  Vector2Adapter,
} from "@dreamlab/engine";

export default class ScatterObstacles extends Behavior {
  @value()
  count: number = 10;

  @value({ type: Vector2Adapter })
  size: Vector2 = Vector2.splat(10);

  @value()
  seed: number = 0;

  @value({ type: EntityRef })
  container: Entity | undefined;

  #reroll = this.game.inputs.create("@obstacles/reroll", "Reroll Obstacles", "KeyR");

  #scatter() {
    if (!this.container) return;
    for (const child of this.container.children.values()) {
      child.destroy();
    }

    const prng = Rng.Seeded(BigInt(this.seed));
    for (let i = 0; i < this.count; i++) {
      const hx = this.size.x / 2;
      const hy = this.size.y / 2;
      const x = StandardUniform.randomBetween(-hx, hx, { prng });
      const y = StandardUniform.randomBetween(-hy, hy, { prng });

      const w = StandardUniform.randomBetween(0.8, 2);
      const h = StandardUniform.randomBetween(0.8, 2);

      this.container.spawn({
        type: Collider,
        name: "Obstacle",
        transform: { position: { x, y }, scale: { x: w, y: h } },
        children: [
          {
            type: ColoredSquare,
            name: ColoredSquare.name,
            values: { color: "#ff746c" },
          },
        ],
      });
    }
  }

  onInitialize(): void {
    if (this.game.isServer()) {
      this.values.get("count")?.onChanged(() => this.#scatter());
      this.values.get("seed")?.onChanged(() => this.#scatter());
      this.#scatter();
    } else if (this.game.isClient()) {
      this.listen(this.#reroll, ActionPressed, () => {
        this.seed = StandardUniform.randomIntegerBetween(
          Number.MIN_SAFE_INTEGER,
          Number.MAX_SAFE_INTEGER,
        );
      });
    }
  }
}
