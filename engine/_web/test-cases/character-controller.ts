import {
  Behavior,
  CharacterController,
  ClientGame,
  Collider,
  Sprite,
  Vector2,
} from "@dreamlab/engine";

// @ts-expect-error: global access
const game = globalThis.game as ClientGame;

game.world.spawn({
  type: Collider,
  name: "WallTop",
  transform: { position: { y: 5 }, scale: { x: 10, y: 0.2 } },
  children: [{ type: Sprite, name: Sprite.name }],
});

game.world.spawn({
  type: Collider,
  name: "WallBottom",
  transform: { position: { y: -5 }, scale: { x: 10, y: 0.2 } },
  children: [{ type: Sprite, name: Sprite.name }],
});

game.world.spawn({
  type: Collider,
  name: "WallLeft",
  transform: { position: { x: -5 }, scale: { x: 0.2, y: 10 } },
  children: [{ type: Sprite, name: Sprite.name }],
});

game.world.spawn({
  type: Collider,
  name: "WallRight",
  transform: { position: { x: 5 }, scale: { x: 0.2, y: 10 } },
  children: [{ type: Sprite, name: Sprite.name }],
});

game.world.spawn({
  type: Collider,
  name: "RandomBlock",
  transform: {
    position: { x: Math.random() * 10 - 5, y: Math.random() * 10 - 5 },
    scale: { x: 0.2, y: 0.2 },
  },
  children: [{ type: Sprite, name: Sprite.name }],
});

class Movement extends Behavior {
  #char = this.entity.cast(CharacterController);

  speed = 1.0;
  jumpForce = 3.0;
  gravity = 9.8;

  #verticalVelocity = 0;

  #up = this.inputs.create("@movement/up", "Move Up", "KeyW");
  #down = this.inputs.create("@movement/down", "Move Down", "KeyS");
  #left = this.inputs.create("@movement/left", "Move Left", "KeyA");
  #right = this.inputs.create("@movement/right", "Move Right", "KeyD");
  #jump = this.inputs.create("@movement/jump", "Jump", "Space");

  onTick(): void {
    if (!this.game.isClient()) return;
    if (this.entity.authority !== this.game.network.self) return;

    const movement = new Vector2(0, 0);

    // Horizontal movement
    if (this.#right.held) movement.x += 1;
    if (this.#left.held) movement.x -= 1;

    // Apply gravity
    this.#verticalVelocity -= this.gravity * (this.game.physics.tickDelta / 1000);

    // Jump
    if (this.#jump.pressed && this.#char.isGrounded) {
      this.#verticalVelocity = this.jumpForce;
    }

    // Apply vertical movement
    movement.y = this.#verticalVelocity;

    const velocity = movement.mul((this.game.physics.tickDelta / 100) * this.speed);
    this.entity.pos.assign(this.entity.pos.add(velocity));
  }
}

game.world.spawn({
  type: CharacterController,
  name: CharacterController.name,
  authority: game.network.self,
  behaviors: [{ type: Movement }],
  children: [{ type: Sprite, name: Sprite.name }],
});
