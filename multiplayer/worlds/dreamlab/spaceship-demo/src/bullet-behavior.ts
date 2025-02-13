import { Behavior, Vector2, Vector2Adapter, syncedValue } from "@dreamlab/engine";

export default class BulletBehavior extends Behavior {
  readonly #lifetime = 5;
  #timer = 0;
  #direction: Vector2;

  @syncedValue()
  speed: number = 1;

  @syncedValue(Vector2Adapter)
  initialVelocity: Vector2 = new Vector2(0, 0);

  onInitialize() {
    const rotation = this.entity.transform.rotation;
    this.#direction = new Vector2(Math.cos(rotation), Math.sin(rotation));
  }

  onTick() {
    if (!this.game.isServer()) return;

    const directionVelocity = this.#direction.mul(this.speed);
    const totalVelocity = directionVelocity.add(this.initialVelocity);

    this.entity.transform.position = this.entity.transform.position.add(totalVelocity);

    this.#timer += this.time.delta / 1000;
    if (this.#timer >= this.#lifetime) {
      this.entity.destroy();
    }
  }
}
