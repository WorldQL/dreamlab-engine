import { Behavior } from "../../../../behavior/mod.ts";
import { Entity, Rigidbody2D, Sprite } from "../../../../entity/mod.ts";
import { Vector2 } from "../../../../math/mod.ts";
import { EntityCollision } from "../../../../signals/mod.ts";
import { HealthBar } from "../behaviors/health-bar.ts";
import { MAP_BOUNDARY } from "../map/map.ts";
import { BulletBehavior } from "./bullet.ts";
import { PlayerBehavior } from "./player.ts";

export class EnemyMovement extends Behavior {
  speed = Math.random() * 0.5 + 0.5;
  minDistance = 5;
  shootDistance = 10;
  lastShootTime = 0;
  shootCooldown = Math.random() * 4000 + 3000;

  onTick(): void {
    const player = this.entity.game.world.children.get("Player");
    const playerPos = player?.globalTransform.position;
    if (!playerPos) return;

    const direction = playerPos.sub(this.entity.transform.position).normalize();
    const distance = playerPos.sub(this.entity.transform.position).magnitude();

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

    this.entity.game.world.spawn({
      type: Rigidbody2D,
      name: "EnemyBullet",
      transform: {
        position: this.entity.transform.position.clone(),
        rotation,
        scale: { x: 0.25, y: 0.25 },
      },
      behaviors: [{ type: BulletBehavior, values: { speed: 8 } }],
      values: { type: "fixed" },
      children: [
        {
          type: Sprite,
          name: "BulletSprite",
          transform: {
            scale: { x: 0.5, y: 0.5 },
          },
        },
      ],
    });
  }
}

export class ExplosionPieceBehavior extends Behavior {
  readonly #lifetime = 1;
  #timer = 0;

  readonly #direction: Vector2 = new Vector2(
    Math.random() * 2 - 1,
    Math.random() * 2 - 1,
  ).normalize();

  onTick(): void {
    const speed = 2;
    this.entity.transform.position = this.entity.transform.position.add(
      this.#direction.mul((this.time.delta / 1000) * speed),
    );

    this.#timer += this.time.delta / 1000;
    if (this.#timer >= this.#lifetime) {
      this.entity.destroy();
    }
  }
}

export class EnemyBehavior extends Behavior {
  private healthBar!: HealthBar;

  onInitialize(): void {
    const health = Math.floor(Math.random() * 3) + 3;
    this.healthBar = this.entity.addBehavior({
      type: HealthBar,
      values: {},
    });

    this.healthBar.initialize(health);

    this.listen(this.entity, EntityCollision, e => {
      if (e.started) this.onCollide(e.other);
    });
  }

  onCollide(other: Entity) {
    if (!other.name.startsWith("Bullet")) return;

    other.destroy();
    this.healthBar.takeDamage(1);
    if (this.healthBar.currentHealth <= 0) {
      const player = this.entity.game.world._.Player;
      player.getBehavior(PlayerBehavior).score += 100;
    }
  }
}

const prefabEnemy = game.prefabs.spawn({
  type: Rigidbody2D,
  name: "Enemy",
  behaviors: [{ type: EnemyMovement }, { type: EnemyBehavior }],
  values: { type: "fixed" },
  children: [
    {
      type: Sprite,
      name: "EnemySprite",
      values: { texture: "https://files.codedred.dev/enemy.png" },
    },
  ],
});

export function spawnEnemy() {
  const player = game.world.children.get("Player");
  if (!player) return;

  const spawnDistance = 40;
  const spawnAngle = Math.random() * 2 * Math.PI;

  const spawnPosition = player.transform.position.add(
    new Vector2(Math.cos(spawnAngle) * spawnDistance, Math.sin(spawnAngle) * spawnDistance),
  );

  spawnPosition.x = Math.max(-MAP_BOUNDARY, Math.min(MAP_BOUNDARY, spawnPosition.x));
  spawnPosition.y = Math.max(-MAP_BOUNDARY, Math.min(MAP_BOUNDARY, spawnPosition.y));

  prefabEnemy.cloneInto(game.world, { transform: { position: spawnPosition } });
}

setInterval(spawnEnemy, Math.random() * 3000 + 3000);
