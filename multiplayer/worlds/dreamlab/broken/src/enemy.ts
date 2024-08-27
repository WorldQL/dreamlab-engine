import { Behavior, Empty, Entity, EntityCollision, RectCollider2D, Rigidbody2D, Sprite2D } from "@dreamlab/engine";
import BulletBehavior from "./bullet-behavior.ts";
import HealthBar from "./health.ts";

export default class EnemyMovement extends Behavior {
  speed = Math.random() * 0.5 + 0.5;
  minDistance = 5;
  shootDistance = 10;
  lastShootTime = 0;
  shootCooldown = Math.random() * 2000 + 1000;

  private healthBar!: HealthBar;

  onInitialize(): void {
    if (!this.game.isServer()) return

    const health = Math.floor(Math.random() * 3) + 3;
    this.healthBar = this.entity.addBehavior({
      type: HealthBar,
      values: { maxHealth: health, currentHealth: health },
    });

    this.listen(this.entity, EntityCollision, e => {
      if (e.started) this.onCollide(e.other);
    });

  }
  onCollide(other: Entity) {
    if (!other.name.startsWith("Bullet")) return;

    other.destroy();
    this.healthBar.takeDamage(1);
  }

  onTick(): void {
    if (!this.game.isServer()) return

    const playersContainer = this.game.world._.PlayersContainer;
    if (!playersContainer) return;

    let closestPlayer: Entity | undefined = undefined;
    let closestDistance = Infinity;

    // Find the closest player
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

    // Move towards the closest player
    if (distance > this.minDistance + 5) {
      let speedFactor = 1;
      if (distance < this.minDistance + 10) {
        speedFactor = (distance - this.minDistance) / 10;
      }
      this.entity.transform.position = this.entity.transform.position.add(
        direction.mul((this.time.delta / 100) * this.speed * speedFactor)
      );
    }

    // Rotate to face the closest player
    const rotation = Math.atan2(direction.y, direction.x);
    this.entity.transform.rotation = rotation - Math.PI / 2;

    // Shoot at the closest player if within range
    if (distance <= this.shootDistance) {
      const now = Date.now();
      if (now - this.lastShootTime > this.shootCooldown) {
        this.lastShootTime = now;
        this.shootAtPlayer()
      }
    }
  }


  shootAtPlayer(): void {
    const rotation = this.entity.transform.rotation + Math.PI / 2;

    this.entity.game.world.spawn({
      type: Rigidbody2D,
      name: "EnemyBullet",
      transform: {
        position: this.entity.transform.position.clone(),
        rotation,
        scale: { x: 0.25, y: 0.25 },
      },
      behaviors: [{ type: BulletBehavior, values: { speed: 0.01 } }],
      children: [
        {
          type: Sprite2D,
          name: "BulletSprite",
          transform: {
            scale: { x: 0.75, y: 0.75 },
          },
        },
      ],
    });
  }
}