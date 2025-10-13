import { Behavior, value, Vector2, Vector2Adapter } from "@dreamlab/engine";

export default class Gravity extends Behavior {
  @value({ type: Vector2Adapter })
  gravity: Vector2 = Vector2.ZERO;

  onInitialize(): void {
    this.game.physics.world.gravity = this.gravity;
  }
}
