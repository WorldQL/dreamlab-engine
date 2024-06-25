import { Vector2 } from "../../math/mod.ts";
import { Behavior } from "../behavior.ts";

export default class WASDMovementBehavior extends Behavior {
  speed = 1.0;

  #up = this.inputs.create("@wasd/up", "Move Up", "KeyW");
  #down = this.inputs.create("@wasd/down", "Move Down", "KeyS");
  #left = this.inputs.create("@wasd/left", "Move Left", "KeyA");
  #right = this.inputs.create("@wasd/right", "Move Right", "KeyD");

  onInitialize(): void {
    this.value(WASDMovementBehavior, "speed");
  }

  onTick(): void {
    const movement = new Vector2(0, 0);
    if (this.#up.pressed) movement.y += 1;
    if (this.#down.pressed) movement.y -= 1;
    if (this.#right.pressed) movement.x += 1;
    if (this.#left.pressed) movement.x -= 1;

    this.entity.transform.position = this.entity.transform.position.add(
      movement.normalize().mul((this.time.delta / 100) * this.speed),
    );
  }
}
