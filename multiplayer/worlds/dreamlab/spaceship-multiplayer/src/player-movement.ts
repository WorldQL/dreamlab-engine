import { Behavior, BehaviorContext, Vector2 } from "@dreamlab/engine";

export default class PlayerMovement extends Behavior {
  speed = 5.0;

  #up = this.inputs.create("@movement/up", "Move Up", "KeyW");
  #down = this.inputs.create("@movement/down", "Move Down", "KeyS");
  #left = this.inputs.create("@movement/left", "Move Left", "KeyA");
  #right = this.inputs.create("@movement/right", "Move Right", "KeyD");
  #boost = this.inputs.create("@movement/boost", "Speed Boost", "ShiftLeft");

  constructor(ctx: BehaviorContext) {
    super(ctx);
    this.defineValues(PlayerMovement, "speed");
  }

  onTick(): void {
    if (this.entity.authority !== this.game.network.self) return;

    const movement = new Vector2(0, 0);

    if (this.#up.held) movement.y += 1;
    if (this.#down.held) movement.y -= 1;
    if (this.#right.held) movement.x += 1;
    if (this.#left.held) movement.x -= 1;

    let currentSpeed = this.speed;
    if (this.#boost.held) currentSpeed *= 2;

    const velocity = movement
      .normalize()
      .mul((this.game.physics.tickDelta / 100) * currentSpeed);

    const cursorPos = this.inputs.cursor.world;
    if (!cursorPos) return;
    this.entity.transform.rotation = this.entity.pos.lookAt(cursorPos);

    this.entity.transform.position = this.entity.transform.position.add(velocity);
  }
}
