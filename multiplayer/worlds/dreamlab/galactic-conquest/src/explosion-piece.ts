import { Behavior, Vector2 } from "@dreamlab/engine";

export default class ExplosionPieceBehavior extends Behavior {
  readonly #lifetime = 1;
  #timer = 0;

  readonly #direction: Vector2 = new Vector2(
    Math.random() * 2 - 1,
    Math.random() * 2 - 1,
  ).normalize();

  onTick(): void {
    const speed = 2;
    this.entity.transform.position = this.entity.transform.position.add(
      this.#direction.mul((this.time.delta / 1000) * speed),
    );

    this.#timer += this.time.delta / 1000;
    if (this.#timer >= this.#lifetime) {
      this.entity.destroy();
    }
  }
}
