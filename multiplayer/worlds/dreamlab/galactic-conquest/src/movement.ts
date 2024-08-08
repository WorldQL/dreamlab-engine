import { Behavior, BehaviorContext, Vector2 } from "@dreamlab/engine";
import { MAP_BOUNDARY } from "./_constants.ts";
import PlayerBehavior from "./player.ts";

export default class Movement extends Behavior {
  speed = 5.0;

  #up = this.inputs.create("@movement/up", "Move Up", "KeyW");
  #down = this.inputs.create("@movement/down", "Move Down", "KeyS");
  #left = this.inputs.create("@movement/left", "Move Left", "KeyA");
  #right = this.inputs.create("@movement/right", "Move Right", "KeyD");
  // #shift = this.inputs.create("@movement/shift", "Speed Boost", "ShiftLeft");

  #fire = this.inputs.create("@clickFire/fire", "Fire", "MouseLeft");

  readonly #cooldown = 0;
  #lastFired = 0;

  velocity = Vector2.ZERO;

  constructor(ctx: BehaviorContext) {
    super(ctx);
    this.defineValues(Movement, "speed");
  }

  onTick(): void {
    const movement = new Vector2(0, 0);
    const currentSpeed = this.speed;

    // if (this.#shift.held) currentSpeed *= 2;

    if (this.#up.held) movement.y += 1;
    if (this.#down.held) movement.y -= 1;
    if (this.#right.held) movement.x += 1;
    if (this.#left.held) movement.x -= 1;

    this.velocity = movement
      .normalize()
      .mul((this.game.physics.tickDelta / 100) * currentSpeed);

    const newPosition = this.entity.transform.position.add(this.velocity);

    const halfWidth = this.entity.transform.scale.x / 2;
    const halfHeight = this.entity.transform.scale.y / 2;
    const safety = 0.5;

    if (newPosition.x - halfWidth <= -MAP_BOUNDARY) newPosition.x = -MAP_BOUNDARY + safety;
    if (newPosition.x + halfWidth >= MAP_BOUNDARY) newPosition.x = MAP_BOUNDARY - safety;

    if (newPosition.y - halfHeight <= -MAP_BOUNDARY) newPosition.y = -MAP_BOUNDARY + safety;
    if (newPosition.y + halfHeight >= MAP_BOUNDARY) newPosition.y = MAP_BOUNDARY - safety;

    if (this.#lastFired > 0) {
      this.#lastFired -= 1;
    } else {
      if (this.#fire.held) {
        const playerBehavior = this.entity.getBehavior(PlayerBehavior);
        const fireRateMultiplier = playerBehavior.fireRateMultiplier;

        this.#lastFired = this.#cooldown / fireRateMultiplier;

        playerBehavior.shootingPattern();
      }
    }

    // face the cursor
    const world = this.inputs.cursor.world;
    if (!world) return;

    const rotation = this.entity.transform.position.lookAt(world);
    this.entity.transform.rotation = rotation;

    this.entity.transform.position = newPosition;
  }
}
