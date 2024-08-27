import { Behavior, Vector2, Vector2Adapter } from "@dreamlab/engine";

export default class BulletBehavior extends Behavior {
  readonly #lifetime = 5;
  #timer = 0;
  #direction = Vector2.ZERO;

  speed: number = 0.01;
  additionalVelocity = Vector2.ZERO;

  onInitialize() {
    this.defineValue(BulletBehavior, "speed");
    this.defineValue(BulletBehavior, "additionalVelocity", { type: Vector2Adapter })

    const rotation = this.entity.transform.rotation;
    this.#direction = new Vector2(Math.cos(rotation), Math.sin(rotation));
  }

  onTick() {
    if (!this.game.isServer()) return;

    const v = this.additionalVelocity.add(this.#direction.mul(this.speed).mul(this.game.time.delta));
    this.entity.transform.position = this.entity.transform.position.add(v)

    this.#timer += this.time.delta / 1000;
    if (this.#timer >= this.#lifetime) {
      this.entity.destroy();
    }
  }
}
