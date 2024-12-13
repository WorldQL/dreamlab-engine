import { Behavior, syncedValue, Vector2 } from "@dreamlab/engine";

export default class WASDMovementBehavior extends Behavior {
  @syncedValue()
  speed = 1.0;

  #up = this.inputs.create("@wasd/up", "Move Up", "KeyW");
  #down = this.inputs.create("@wasd/down", "Move Down", "KeyS");
  #left = this.inputs.create("@wasd/left", "Move Left", "KeyA");
  #right = this.inputs.create("@wasd/right", "Move Right", "KeyD");

  override onTick(): void {
    if (this.entity.authority !== this.game.network.self) return;

    const movement = Vector2.ZERO;
    if (this.#up.held) movement.y += 1;
    if (this.#down.held) movement.y -= 1;
    if (this.#right.held) movement.x += 1;
    if (this.#left.held) movement.x -= 1;

    if (movement.x === 0 && movement.y === 0) return;

    this.entity.transform.position = this.entity.transform.position.add(
      movement.normalize().mul((this.time.delta / 100) * this.speed),
    );
  }
}
