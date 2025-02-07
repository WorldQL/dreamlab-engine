import {
  Behavior,
  CharacterController,
  RichText,
  Vector2,
  syncedValue,
} from "@dreamlab/engine";

// A very simple platformer controller

export default class PlayerController extends Behavior {
  #controller = this.entity.cast(CharacterController);

  @syncedValue() speed = 10;
  @syncedValue() jumpForce = 20;
  @syncedValue() jumpAcceleration = 40;
  @syncedValue() gravity = 90;
  @syncedValue() maxJumpTime = 1; // Maximum duration the jump key affects the jump

  @syncedValue() points = 0;

  #verticalVelocity = 0;
  #jumpTimeCounter = 0;

  #left = this.inputs.create("@movement/left", "Move Left", "KeyA");
  #right = this.inputs.create("@movement/right", "Move Right", "KeyD");
  #jump = this.inputs.create("@movement/jump", "Jump", "Space");

  onInitializeClient() {
    if (!this.hasAuthority()) return;
    this.values.get("points")?.onChanged((newPoints: number) => {
      this.game.local!._.CoinCounter.cast(RichText).text = "Coins: " + newPoints;
    });
  }

  onTickClient(): void {
    if (!this.hasAuthority()) return;

    const deltaTime = this.game.physics.tickDelta / 1_000; // Convert to seconds

    let horizontalInput = 0;
    if (this.#right.held) horizontalInput += 1;
    if (this.#left.held) horizontalInput -= 1;

    const horizontalVelocity = horizontalInput * this.speed;

    // Jumping logic
    if (this.#jump.pressed && this.#controller.isGrounded) {
      this.#verticalVelocity = this.jumpForce;
      this.#jumpTimeCounter = 0;
    }

    if (this.#jump.held && this.#jumpTimeCounter < this.maxJumpTime) {
      // Apply upward acceleration while the jump key is held
      this.#verticalVelocity += this.jumpAcceleration * deltaTime;
      this.#jumpTimeCounter += deltaTime;
    }

    // Create movement vector
    const movement = new Vector2(
      horizontalVelocity * deltaTime,
      this.#verticalVelocity * deltaTime,
    );

    if (!this.#controller.isGrounded) this.#verticalVelocity -= this.gravity * deltaTime;

    this.entity.pos = this.entity.pos.add(movement);
  }
}
