import {
  Behavior,
  Entity,
  EntityCollision,
  Sprite,
  Vector2,
  syncedValue,
} from "@dreamlab/engine";
import HealthBar from "./health.ts";

export default class EnemyMovement extends Behavior {
  speed = Math.random() * 0.5 + 0.5;
  minDistance = 5;
  shootDistance = 10;
  lastShootTime = 0;
  shootCooldown = Math.random() * 2000 + 1000;

  private healthBar!: HealthBar;

  @syncedValue()
  private isTakingDamage = false;

  @syncedValue()
  private damageTimer = 0;

  private knockbackDirection: Vector2 | null = null;

  onInitialize(): void {
    if (!this.game.isServer()) return;

    const health = Math.floor(Math.random() * 3) + 3;
    this.healthBar = this.entity.addBehavior({
      type: HealthBar,
      values: { maxHealth: health, currentHealth: health, runsOn: "server" },
    });

    this.listen(this.entity, EntityCollision, e => {
      if (e.started) this.onCollide(e.other);
    });
  }

  onCollide(other: Entity) {
    if (!other.name.startsWith("Bullet")) return;

    const sprite = this.entity._.Sprite.cast(Sprite);

    this.isTakingDamage = true;
    this.damageTimer = 200; // 200ms duration for the effect

    this.knockbackDirection = this.entity.transform.position
      .sub(other.transform.position)
      .normalize();

    // Visual feedback: reduce opacity
    sprite.alpha = 0.5;

    other.destroy();
    this.healthBar.takeDamage(1);
  }

  onTick(): void {
    if (!this.game.isServer()) return;

    // Handle knockback and shrink effect during damage state
    if (this.isTakingDamage) {
      const sprite = this.entity._.Sprite.cast(Sprite);
      const originalScale = { x: 1, y: 1 };

      // Apply knockback
      if (this.knockbackDirection) {
        this.entity.transform.position = this.entity.transform.position.add(
          this.knockbackDirection.mul(0.1), // Small knockback each tick
        );
      }

      // Shrink and reset scale over time
      this.entity.transform.scale = { x: 0.8, y: 0.8 };

      // Timer for damage state
      this.damageTimer -= this.time.delta;
      if (this.damageTimer <= 0) {
        this.isTakingDamage = false;
        sprite.alpha = 1; // Reset opacity
        this.entity.transform.scale = originalScale; // Reset scale
      }
    }

    // Move towards the closest player
    const playersContainer = this.game.world._.PlayersContainer;
    if (!playersContainer) return;

    let closestPlayer: Entity | undefined = undefined;
    let closestDistance = Infinity;

    for (const player of playersContainer.children.values()) {
      const playerPos = player.globalTransform.position;
      const distance = playerPos.sub(this.entity.transform.position).magnitude();

      if (distance < closestDistance) {
        closestPlayer = player;
        closestDistance = distance;
      }
    }

    if (!closestPlayer) return;

    const playerPos = closestPlayer.globalTransform.position;
    const direction = playerPos.sub(this.entity.transform.position).normalize();
    const distance = closestDistance;

    if (distance > this.minDistance + 5) {
      let speedFactor = 1;
      if (distance < this.minDistance + 10) {
        speedFactor = (distance - this.minDistance) / 10;
      }
      this.entity.transform.position = this.entity.transform.position.add(
        direction.mul((this.time.delta / 100) * this.speed * speedFactor),
      );
    }

    const rotation = Math.atan2(direction.y, direction.x);
    this.entity.transform.rotation = rotation - Math.PI / 2;

    if (distance <= this.shootDistance) {
      const now = Date.now();
      if (now - this.lastShootTime > this.shootCooldown) {
        this.lastShootTime = now;
        this.shootAtPlayer();
      }
    }
  }

  shootAtPlayer(): void {
    const rotation = this.entity.transform.rotation + Math.PI / 2;

    this.game.prefabs._.Bullet.cloneInto(this.game.world._.BulletContainer, {
      name: "EnemyBullet",
      transform: {
        position: this.entity.transform.position.clone(),
        rotation,
      },
    });
  }
}
