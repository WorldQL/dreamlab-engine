import {
  Behavior,
  BehaviorContext,
  EntityDestroyed,
  Rigidbody2D,
  Vector2,
} from "@dreamlab/engine";
import { Collider, KinematicCharacterController, RigidBody } from "@dreamlab/vendor/rapier.ts";

export default class PlayerMovement extends Behavior {
  speed = 5.0;

  #up = this.inputs.create("@movement/up", "Move Up", "KeyW");
  #down = this.inputs.create("@movement/down", "Move Down", "KeyS");
  #left = this.inputs.create("@movement/left", "Move Left", "KeyA");
  #right = this.inputs.create("@movement/right", "Move Right", "KeyD");
  #boost = this.inputs.create("@movement/boost", "Speed Boost", "ShiftLeft");

  #controller:
    | { collider: Collider; body: RigidBody; controller: KinematicCharacterController }
    | undefined;

  constructor(ctx: BehaviorContext) {
    super(ctx);
    this.defineValues(PlayerMovement, "speed");
  }

  onInitialize(): void {
    if (this.entity.authority !== this.game.network.self) return;

    if (this.entity instanceof Rigidbody2D) {
      this.#controller = {
        collider: this.entity.collider,
        body: this.entity.body,
        controller: this.game.physics.world.createCharacterController(0.01),
      };
    }

    this.listen(this.entity, EntityDestroyed, () => {
      if (!this.#controller) return;
      this.game.physics.world.removeCharacterController(this.#controller.controller);
    });
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
    this.entity._.Sprite2D.globalTransform.rotation = this.entity.pos.lookAt(cursorPos);

    if (this.#controller) {
      this.#controller.controller.computeColliderMovement(this.#controller.collider, velocity);
      const corrected = this.#controller.controller.computedMovement();
      this.entity.pos = this.entity.pos.add(corrected);
    } else {
      this.entity.pos = this.entity.pos.add(velocity);
    }
  }
}
