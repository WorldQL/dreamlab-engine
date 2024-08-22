import {
  Behavior,
  EntityDestroyed,
  RectCollider2D,
  Rigidbody2D,
  Sprite2D,
  Vector2,
} from "@dreamlab/engine";
import { KinematicCharacterController } from "@dreamlab/vendor/rapier.ts";

game.world.spawn({
  type: RectCollider2D,
  name: "WallTop",
  transform: { position: { y: 5 }, scale: { x: 10, y: 0.2 } },
  children: [{ type: Sprite2D, name: Sprite2D.name }],
});

game.world.spawn({
  type: RectCollider2D,
  name: "WallBottom",
  transform: { position: { y: -5 }, scale: { x: 10, y: 0.2 } },
  children: [{ type: Sprite2D, name: Sprite2D.name }],
});

game.world.spawn({
  type: RectCollider2D,
  name: "WallLeft",
  transform: { position: { x: -5 }, scale: { x: 0.2, y: 10 } },
  children: [{ type: Sprite2D, name: Sprite2D.name }],
});

game.world.spawn({
  type: RectCollider2D,
  name: "WallRight",
  transform: { position: { x: 5 }, scale: { x: 0.2, y: 10 } },
  children: [{ type: Sprite2D, name: Sprite2D.name }],
});

game.world.spawn({
  type: RectCollider2D,
  name: "RandomBlock",
  transform: {
    position: { x: Math.random() * 10 - 5, y: Math.random() * 10 - 5 },
    scale: { x: 0.2, y: 0.2 },
  },
  children: [{ type: Sprite2D, name: Sprite2D.name }],
});

class Movement extends Behavior {
  #body = this.entity.cast(Rigidbody2D);
  #controller: KinematicCharacterController | undefined;

  speed = 1.0;
  jumpForce = 3.0;
  gravity = 9.8;

  #verticalVelocity = 0;
  #isGrounded = false;

  #up = this.inputs.create("@movement/up", "Move Up", "KeyW");
  #down = this.inputs.create("@movement/down", "Move Down", "KeyS");
  #left = this.inputs.create("@movement/left", "Move Left", "KeyA");
  #right = this.inputs.create("@movement/right", "Move Right", "KeyD");
  #jump = this.inputs.create("@movement/jump", "Jump", "Space");

  onInitialize(): void {
    if (this.game.isClient()) {
      this.#controller = this.game.physics.world.createCharacterController(0.01);
    }

    this.listen(this.entity, EntityDestroyed, () => {
      if (this.#controller) this.game.physics.world.removeCharacterController(this.#controller);
    });
  }

  onTick(): void {
    if (!this.#controller) return;

    const movement = new Vector2(0, 0);

    // Horizontal movement
    if (this.#right.held) movement.x += 1;
    if (this.#left.held) movement.x -= 1;

    // Apply gravity
    this.#verticalVelocity -= this.gravity * (this.game.physics.tickDelta / 1000);

    // Jump
    if (this.#jump.pressed && this.#isGrounded) {
      this.#verticalVelocity = this.jumpForce;
    }

    // Apply vertical movement
    movement.y = this.#verticalVelocity;

    const velocity = movement.mul((this.game.physics.tickDelta / 100) * this.speed);
    this.#controller.computeColliderMovement(this.#body.collider, velocity);
    const corrected = this.#controller.computedMovement();

    this.#isGrounded = this.#controller.computedGrounded();

    this.entity.pos = this.entity.pos.add(corrected);
  }
}

export const player = game.local.spawn({
  type: Rigidbody2D,
  name: "Player",
  behaviors: [{ type: Movement }],
  children: [
    { type: Sprite2D, name: Sprite2D.name, values: { texture: "https://lulu.dev/avatar.png" } },
  ],
  transform: { scale: { x: 2 } },
});
