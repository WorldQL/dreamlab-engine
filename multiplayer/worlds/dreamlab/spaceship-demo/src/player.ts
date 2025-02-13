import {
  Behavior,
  Entity,
  EntityCollision,
  Sprite,
  Vector2,
  syncedValue,
} from "@dreamlab/engine";
import HealthBar from "./health.ts";

export default class SpaceshipPlayer extends Behavior {
  @syncedValue()
  speed = 5.0;

  #up = this.inputs.create("@movement/up", "Move Up", "KeyW");
  #down = this.inputs.create("@movement/down", "Move Down", "KeyS");
  #left = this.inputs.create("@movement/left", "Move Left", "KeyA");
  #right = this.inputs.create("@movement/right", "Move Right", "KeyD");

  #fire = this.inputs.create("@clickFire/fire", "Fire", "MouseLeft");

  private currentVelocity = new Vector2(0, 0);

  onInitialize(): void {
    if (!this.game.isClient()) return;
    if (this.entity.authority !== this.game.network.self) return;

    this.listen(this.entity, EntityCollision, e => {
      if (e.started) this.onCollide(e.other);
    });
  }

  onCollide(other: Entity) {
    if (other.name.startsWith("EnemyBullet")) {
      other.destroy();

      // Access the sprite for visual effects
      const sprite = this.entity._.Sprite.cast(Sprite);

      // Apply damage effects: reduce opacity and add a red tint
      sprite.alpha = 0.5;
      sprite.sprite!.tint = 0xff5555;

      // Reset effects after a short delay
      setTimeout(() => {
        sprite.alpha = 1;
        sprite.sprite!.tint = 0xffffff;
      }, 250);

      // Apply health damage
      const healthBehavior = this.entity.getBehavior(HealthBar);
      healthBehavior.takeDamage(10);
    }
  }

  onTick(): void {
    if (!this.game.isClient()) return;
    if (this.entity.authority !== this.game.network.self) return;

    // Calculate movement based on inputs
    const movement = new Vector2(0, 0);
    if (this.#up.held) movement.y += 1;
    if (this.#down.held) movement.y -= 1;
    if (this.#right.held) movement.x += 1;
    if (this.#left.held) movement.x -= 1;

    const currentSpeed = this.speed;
    this.currentVelocity = movement
      .normalize()
      .mul((this.game.time.delta / 1000) * currentSpeed);

    // Update player's position first
    this.entity.pos = this.entity.pos.add(this.currentVelocity);

    // Update rotation based on cursor
    const cursorPos = this.inputs.cursor.world;
    if (!cursorPos) return;
    const rotation = this.entity.pos.lookAt(cursorPos);
    this.entity._.Sprite.globalTransform.rotation = rotation;

    // Fire bullet after position update
    if (this.#fire.pressed) {
      this.fireBullet(rotation);
    }
  }

  private fireBullet(offsetAngle: number) {
    const world = this.inputs.cursor.world;
    if (!world) return;

    // Base player position plus the current velocity offset
    const pos = this.entity.globalTransform.position.bare();
    const playerPos = new Vector2(pos.x, pos.y).add(this.currentVelocity);

    // Calculate rotation based on cursor direction
    const baseDirection = world.sub(playerPos);
    const baseRotation = Math.atan2(baseDirection.y, baseDirection.x);
    const bulletRotation = baseRotation + offsetAngle * (Math.PI / 180);

    // Offset the bullet to the tip of the player
    const playerScale = this.entity.transform.scale;
    const offsetDistance = 0.5;
    const bulletOffset = new Vector2(
      Math.cos(bulletRotation) * offsetDistance * playerScale.x,
      Math.sin(bulletRotation) * offsetDistance * playerScale.y,
    );

    const bulletPosition = new Vector2({
      x: playerPos.x + bulletOffset.x,
      y: playerPos.y + bulletOffset.y,
    });

    // Shooting effect: slight shrink and reset
    const originalScale = this.entity.transform.scale.clone();
    this.entity.transform.scale = originalScale.mul(0.9);
    setTimeout(() => {
      this.entity.transform.scale = originalScale;
    }, 100);

    // Spawn bullet at the calculated position
    const bullet = this.game.prefabs._.Bullet.cloneInto(this.game.world._.BulletContainer, {
      name: "Bullet",
      transform: {
        position: bulletPosition,
        rotation: bulletRotation,
      },
    });

    // Pass the player's current velocity into the bullet
    bullet.set({
      initialVelocity: playerPos,
    });
  }
}
