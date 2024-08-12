import { Behavior, BehaviorContext, Vector2, Vector2Adapter } from "@dreamlab/engine";
import Movement from "./movement.ts";

export default class BulletBehavior extends Behavior {
  readonly #lifetime = 5;
  #timer = 0;
  #direction: Vector2;

  speed: number = 0.07;
  velocity = Vector2.ZERO;

  constructor(ctx: BehaviorContext) {
    super(ctx);
    this.defineValues(BulletBehavior, "speed");
    this.defineValue(BulletBehavior, "velocity", { type: Vector2Adapter });

    const rotation = this.entity.transform.rotation;
    this.#direction = new Vector2(Math.cos(rotation), Math.sin(rotation));
    this.velocity = this.entity.parent!._.Player.getBehavior(Movement).velocity;
  }

  onTick(): void {
    // const speed = (this.time.delta / 1000) * this.speed;
    const v = this.velocity.add(this.#direction.mul(this.speed).mul(this.game.time.delta));
    this.entity.transform.position.assign(this.entity.transform.position.add(v));

    this.#timer += this.time.delta / 1000;
    if (this.#timer >= this.#lifetime) {
      this.entity.destroy();
    }
  }
}
