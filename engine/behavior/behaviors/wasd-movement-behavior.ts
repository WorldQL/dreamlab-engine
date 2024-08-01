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

  update(): void {
    const movement = new Vector2(0, 0);
    if (this.#up.held) movement.y += 1;
    if (this.#down.held) movement.y -= 1;
    if (this.#right.held) movement.x += 1;
    if (this.#left.held) movement.x -= 1;

    this.entity.transform.position = this.entity.transform.position.add(
      movement.normalize().mul((this.time.delta / 100) * this.speed),
    );
  }
}
