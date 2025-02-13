import type { AnimatedSprite, Empty, Entity } from "@dreamlab/engine";
import {
  Behavior,
  CharacterController,
  EntityByRefAdapter,
  RelativeEntity,
  syncedValue,
  Vector2,
  Vector2Adapter,
} from "@dreamlab/engine";
import type { Cuboid } from "@dreamlab/vendor/rapier.ts";
import RAPIER from "@dreamlab/vendor/rapier.ts";
import MovingPlatform from "./moving-platform.ts";

export default class PlatformPlayer extends Behavior {
  #character: CharacterController = this.entity.cast(CharacterController);

  @syncedValue() speed = 10;
  @syncedValue() jumpForce = 20;
  @syncedValue() jumpAcceleration = 40;
  @syncedValue() gravity = 90;
  @syncedValue() maxJumpTime = 1;
  @syncedValue() coyoteTime = 0;

  horizontalVelocity = 0;
  verticalVelocity = 0;
  grounded = false;
  #jumpTimeCounter = 0;
  #isJumping = false;

  #left = this.inputs.create("@movement/left", "Move Left", "KeyA");
  #right = this.inputs.create("@movement/right", "Move Right", "KeyD");
  #jump = this.inputs.create("@movement/jump", "Jump", "Space");

  @syncedValue(EntityByRefAdapter)
  stickingTo: Entity | undefined;

  @syncedValue(Vector2Adapter)
  stickingDiff: Vector2 = new Vector2({ x: 0, y: 0 });

  @syncedValue(RelativeEntity) idleAnim: AnimatedSprite;
  @syncedValue(RelativeEntity) runAnim: AnimatedSprite;
  @syncedValue(RelativeEntity) walkAnim: AnimatedSprite;
  @syncedValue(RelativeEntity) jumpAnim: AnimatedSprite;
  @syncedValue(RelativeEntity) fallAnim: AnimatedSprite;
  @syncedValue(RelativeEntity) animationsContainer: Empty;

  onTickClient(): void {
    // If we have no authority but are 'sticking', just match platform position
    if (!this.hasAuthority() && this.stickingTo && this.stickingDiff) {
      this.entity.pos = this.stickingTo.pos.add(this.stickingDiff);
      return;
    }

    if (!this.hasAuthority()) return;

    // disable all animations
    this.idleAnim.enabled = false;
    this.runAnim.enabled = false;
    this.walkAnim.enabled = false;
    this.jumpAnim.enabled = false;
    this.fallAnim.enabled = false;

    const deltaTime = this.game.physics.tickDelta / 1_000;
    this.grounded = this.#character.isGrounded;

    // --- 1) HORIZONTAL INPUT ---
    let horizontalInput = 0;
    if (this.#right.held) horizontalInput += 1;
    if (this.#left.held) horizontalInput -= 1;
    this.horizontalVelocity = horizontalInput * this.speed;

    if (horizontalInput > 0) {
      this.animationsContainer.transform.scale.x = Math.abs(
        this.animationsContainer.transform.scale.x,
      );
      this.runAnim.enabled = true;
    } else if (horizontalInput < 0) {
      this.animationsContainer.transform.scale.x =
        Math.abs(this.animationsContainer.transform.scale.x) * -1;
      this.runAnim.enabled = true;
    } else {
      this.idleAnim.enabled = true;
    }

    // --- 2) IF STICKING TO PLATFORM ---
    if (this.stickingTo) {
      if (this.#jump.pressed) {
        this.#isJumping = true;
        // Jumping off a moving platform
        const behavior = this.stickingTo.getBehavior(MovingPlatform);
        this.unstickFromPlatform();

        this.verticalVelocity = this.jumpForce + behavior.motion.y;
        this.horizontalVelocity += behavior.motion.x;

        this.#jumpTimeCounter = 0;
        this.coyoteTime = 0;

        const jumpMovement = new Vector2(
          this.horizontalVelocity * deltaTime,
          this.verticalVelocity * deltaTime,
        );
        this.entity.pos = this.entity.pos.add(jumpMovement);
        return;
      }

      // Move horizontally with platform
      this.stickingDiff.x += this.horizontalVelocity * deltaTime;
      if (!this.isStillOnPlatform()) {
        this.unstickFromPlatform();
      } else {
        this.entity.pos = this.stickingTo.pos.add(this.stickingDiff);
      }

      return;
    }

    // --- 3) COYOTE TIME UPDATE ---
    this.coyoteTime = this.grounded ? 0.1 : Math.max(this.coyoteTime - deltaTime, 0);

    // --- 4) NORMAL MOVEMENT (NOT STICKING) ---
    // Jump if pressed and we are grounded or coyote time is active
    if (this.#jump.pressed && (this.grounded || this.coyoteTime > 0)) {
      this.verticalVelocity = this.jumpForce;
      this.#jumpTimeCounter = 0;
      this.coyoteTime = 0; // consume coyote time
      this.#isJumping = true;
    }

    // Continue jump while holding the key
    if (this.#jump.held && this.#jumpTimeCounter < this.maxJumpTime) {
      this.verticalVelocity += this.jumpAcceleration * deltaTime;
      this.#jumpTimeCounter += deltaTime;

      // -- CLAMP TO AVOID EXCESSIVE VELOCITY --
      // Pick a max jump velocity you feel is reasonable.
      const maxJumpVelocity = this.jumpForce + 15;
      if (this.verticalVelocity > maxJumpVelocity) {
        this.verticalVelocity = maxJumpVelocity;
      }
    }

    // --- 5) GRAVITY ---
    if (!this.grounded) {
      if (this.coyoteTime > 0) {
        // Stabilize vertical velocity during coyote time
        this.verticalVelocity = 0;
      } else {
        // Apply gravity after coyote time ends
        this.verticalVelocity -= this.gravity * deltaTime;
      }
    }

    if (!this.grounded && !this.#isJumping && !this.stickingTo) {
      this.fallAnim.enabled = true;
    }

    // When landing, our vertical velocity is lower than -1
    if (this.grounded && this.verticalVelocity < -1) {
      this.#isJumping = false;
    }

    // Check head collision if moving up
    if (this.verticalVelocity > 0) {
      this.checkHeadCollision();
    }

    // Apply final movement
    const movement = new Vector2(
      this.horizontalVelocity * deltaTime,
      this.verticalVelocity * deltaTime,
    );

    if (this.#isJumping) {
      this.jumpAnim.enabled = true;
      this.runAnim.enabled = false;
      this.idleAnim.enabled = false;
    }

    this.handleFootRays(movement);
  }

  // After calculating movement, do foot-ray checks & apply final position
  private handleFootRays(movement: Vector2): void {
    const halfExtents = (this.#character.collider.shape as Cuboid).halfExtents;

    // Foot rays
    const leftRay = new RAPIER.Ray(
      { x: this.entity.pos.x - halfExtents.x - 0.15, y: this.entity.pos.y },
      { x: 0, y: -(halfExtents.y + 0.2) },
    );
    const rightRay = new RAPIER.Ray(
      { x: this.entity.pos.x + halfExtents.x + 0.15, y: this.entity.pos.y },
      { x: 0, y: -(halfExtents.y + 0.2) },
    );

    let foundPlatform: Entity | undefined;

    // Left foot check
    const leftHit = this.game.physics.world.castRay(
      leftRay,
      1,
      true,
      undefined,
      undefined,
      this.#character.collider,
    );
    if (leftHit && this.grounded) {
      const body = this.game.physics.world.colliders.get(leftHit.collider.handle) as any;
      if (body) {
        const ref = body.userData.entityRef as string;
        const e = this.game.entities.lookupByRef(ref);
        if (e?.getBehaviorIfExists(MovingPlatform)) {
          foundPlatform = e;
        }
      }
    }

    // Right foot check
    if (!foundPlatform) {
      const rightHit = this.game.physics.world.castRay(
        rightRay,
        1,
        true,
        undefined,
        undefined,
        this.#character.collider,
      );
      if (rightHit && this.grounded) {
        const body = this.game.physics.world.colliders.get(rightHit.collider.handle) as any;
        if (body) {
          const ref = body.userData.entityRef as string;
          const e = this.game.entities.lookupByRef(ref);
          if (e?.getBehaviorIfExists(MovingPlatform)) {
            foundPlatform = e;
          }
        }
      }
    }

    // Stick to platform if found & grounded
    if (foundPlatform && !this.stickingTo) {
      this.stickingTo = foundPlatform;
      // perfectly stick to the top of the platform
      const platformHeight = foundPlatform.globalTransform.scale.y;
      const playerHeight = this.entity.globalTransform.scale.y;
      const verticalOffset = platformHeight / 2 + playerHeight / 2;
      this.stickingDiff = this.entity.pos.sub(foundPlatform.pos);
      this.stickingDiff.y = verticalOffset;
    }

    // If not sticking, apply movement
    if (!this.stickingTo) {
      this.entity.pos = this.entity.pos.add(movement);
    }
  }

  /**
   * HEAD COLLISION CHECK:
   * If the player is moving upward, cast rays above the head.
   * If there's a hit, clamp verticalVelocity = 0.
   */
  // #region checkHeadCollision()
  private checkHeadCollision(): void {
    const halfExtents = (this.#character.collider.shape as Cuboid).halfExtents;
    const world = this.game.physics.world;

    const leftHeadRay = new RAPIER.Ray(
      { x: this.entity.pos.x - halfExtents.x, y: this.entity.pos.y },
      { x: 0, y: halfExtents.y + 0.1 },
    );
    const midHeadRay = new RAPIER.Ray(
      { x: this.entity.pos.x, y: this.entity.pos.y },
      { x: 0, y: halfExtents.y + 0.1 },
    );
    const rightHeadRay = new RAPIER.Ray(
      { x: this.entity.pos.x + halfExtents.x, y: this.entity.pos.y },
      { x: 0, y: halfExtents.y + 0.1 },
    );

    // Cast each ray. If any hit, we clamp upward velocity.
    const leftHit = world.castRay(
      leftHeadRay,
      1,
      true,
      undefined,
      undefined,
      this.#character.collider,
    );
    const midHit = world.castRay(
      midHeadRay,
      1,
      true,
      undefined,
      undefined,
      this.#character.collider,
    );
    const rightHit = world.castRay(
      rightHeadRay,
      1,
      true,
      undefined,
      undefined,
      this.#character.collider,
    );

    if (leftHit || midHit || rightHit) {
      // Stop upward movement
      this.verticalVelocity = 0;
      // End the jump so holding the key doesn’t keep pushing upward
      this.#jumpTimeCounter = this.maxJumpTime;
    }
  }

  /**
   * Unstick from the current platform.
   */
  // #region unstick()
  private unstickFromPlatform() {
    this.stickingTo = undefined;
    this.stickingDiff = new Vector2({ x: 0, y: 0 });
  }

  /**
   * Check if we are still on the same platform we stuck to.
   * If the ray no longer hits that platform, we detach.
   */
  // #region isStillOnPlatform()
  private isStillOnPlatform(): boolean {
    if (!this.stickingTo) return false;

    const halfExtents = (this.#character.collider.shape as Cuboid).halfExtents;

    // Left foot ray
    const leftRay = new RAPIER.Ray(
      { x: this.entity.pos.x - halfExtents.x - 0.15, y: this.entity.pos.y },
      { x: 0, y: -(halfExtents.y + 0.5) },
    );
    // Right foot ray
    const rightRay = new RAPIER.Ray(
      { x: this.entity.pos.x + halfExtents.x + 0.15, y: this.entity.pos.y },
      { x: 0, y: -(halfExtents.y + 0.5) },
    );

    // Check left foot
    const leftHit = this.game.physics.world.castRay(
      leftRay,
      1,
      true,
      undefined,
      undefined,
      this.#character.collider,
    );
    if (leftHit) {
      const leftBody = this.game.physics.world.colliders.get(leftHit.collider.handle) as any;
      if (leftBody) {
        const leftRef = leftBody.userData.entityRef as string;
        if (leftRef === this.stickingTo.ref) {
          return true; // left foot is still on platform
        }
      }
    }

    // Check right foot
    const rightHit = this.game.physics.world.castRay(
      rightRay,
      1,
      true,
      undefined,
      undefined,
      this.#character.collider,
    );
    if (rightHit) {
      const rightBody = this.game.physics.world.colliders.get(rightHit.collider.handle) as any;
      if (rightBody) {
        const rightRef = rightBody.userData.entityRef as string;
        if (rightRef === this.stickingTo.ref) {
          return true; // right foot is still on platform
        }
      }
    }

    // Neither foot saw the platform => not on it anymore
    return false;
  }
}
