import { Behavior, BehaviorContext, Vector2 } from "@dreamlab/engine";

export default class AsteroidMovement extends Behavior {
  readonly #direction = new Vector2(Math.random() * 2 - 1, Math.random() * 2 - 1).normalize();

  speed = 0.2;

  constructor(ctx: BehaviorContext) {
    super(ctx);
    this.defineValues(AsteroidMovement, "speed");
  }

  onTick(): void {
    this.entity.transform.position = this.entity.transform.position.add(
      this.#direction.mul((this.time.delta / 100) * this.speed),
    );
  }
}
