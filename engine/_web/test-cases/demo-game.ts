import { BackgroundBehavior } from "../../behavior/behaviors/background-behavior.ts";
import { Behavior, BehaviorContext } from "../../behavior/mod.ts";
import { Empty, Entity, Sprite2D, TilingSprite2D, Rigidbody2D } from "../../entity/mod.ts";
import { Vector2 } from "../../math/mod.ts";
import { EntityCollision, GamePostRender } from "../../signals/mod.ts";

// #region Health
class HealthBar extends Behavior {
  maxHealth!: number;
  currentHealth!: number;
  healthBar!: Entity;

  initialize(maxHealth: number): void {
    this.maxHealth = maxHealth;
    this.currentHealth = maxHealth;

    this.healthBar = this.entity.game.world.spawn({
      type: Sprite2D,
      name: "HealthBar",
      transform: { position: { x: 0, y: 1 }, scale: { x: 1, y: 0.1 } },
      values: { texture: "https://files.codedred.dev/healthbar.png" },
    });

    this.entity.game.on(GamePostRender, () => {
      this.healthBar.transform.position = this.entity.transform.position.add(new Vector2(0, 1));
      this.updateHealthBar();
    });
  }

  updateHealthBar(): void {
    const healthRatio = this.currentHealth / this.maxHealth;
    this.healthBar.transform.scale.x = healthRatio;
  }

  takeDamage(damage: number): void {
    this.currentHealth -= damage;
    if (this.currentHealth <= 0) {
      this.currentHealth = 0;
      this.entity.destroy();
      this.healthBar.destroy();
      this.spawnExplosionPieces();
    }
    this.updateHealthBar();
  }

  spawnExplosionPieces(): void {
    const pieceCount = Math.random() * 5 + 3;
    const pieceSize = { x: 0.15, y: 0.15 };

    for (let i = 0; i < pieceCount; i++) {
      this.entity.game.world.spawn({
        type: Rigidbody2D,
        name: "ExplosionPiece",
        transform: {
          position: this.entity.transform.position.clone(),
          scale: pieceSize,
        },
        behaviors: [{ type: ExplosionPieceBehavior }],
        children: [
          {
            type: Sprite2D,
            name: "PieceSprite",
            values: { texture: "https://files.codedred.dev/enemy.png" },
          },
        ],
      });
    }
  }
}

// #region Movement
class Movement extends Behavior {
  speed = 1.0;

  #forward = this.inputs.create("@wasd/up", "Move Forward", "KeyW");
  #backward = this.inputs.create("@wasd/down", "Move Backward", "KeyS");
  #left = this.inputs.create("@wasd/left", "Move Left", "KeyA");
  #right = this.inputs.create("@wasd/right", "Move Right", "KeyD");
  #shift = this.inputs.create("@wasd/shift", "Speed Boost", "ShiftLeft");

  onInitialize(): void {
    this.value(Movement, "speed");
  }

  onTick(): void {
    let movement = new Vector2(0, 0);
    let currentSpeed = this.speed;

    if (this.#shift.held) currentSpeed *= 2;

    const rotation = this.entity.transform.rotation;
    const forward = new Vector2(Math.sin(rotation), -Math.cos(rotation));
    const right = new Vector2(Math.cos(rotation), Math.sin(rotation));

    if (this.#forward.held) movement = movement.sub(forward);
    if (this.#backward.held) movement = movement.add(forward);
    if (this.#right.held) movement = movement.add(right);
    if (this.#left.held) movement = movement.sub(right);

    this.entity.transform.position = this.entity.transform.position.add(
      movement.normalize().mul((this.time.delta / 100) * currentSpeed),
    );
  }
}

class LookAtMouse extends Behavior {
  onTick(): void {
    const cursor = this.inputs.cursor;
    if (!cursor) return;

    const rotation = this.entity.globalTransform.position.lookAt(cursor.world);
    this.entity.transform.rotation = rotation;
  }
}

// #region Bullet
class BulletBehavior extends Behavior {
  speed: number;
  private timer = 0;
  private readonly lifetime = 3;
  private direction: Vector2;

  constructor(ctx: BehaviorContext) {
    super(ctx);
    this.speed = typeof ctx.values?.speed === "number" ? ctx.values.speed : 75;
    const rotation = this.entity.transform.rotation;
    this.direction = new Vector2(Math.cos(rotation), Math.sin(rotation));
  }

  onTick(): void {
    const speed = (this.time.delta / 1000) * this.speed;
    this.entity.transform.position.assign(
      this.entity.transform.position.add(this.direction.mul(speed)),
    );

    this.timer += this.time.delta / 1000;

    if (this.timer >= this.lifetime) {
      this.entity.destroy();
    }
  }
}

class ClickFire extends Behavior {
  fire = this.inputs.create("fire", "Fire", "MouseLeft");

  cooldown = 10; // ticks
  #lastFired = 0;

  onTick(): void {
    if (this.#lastFired > 0) {
      this.#lastFired -= 1;
      return;
    }

    if (this.fire.held) {
      this.#lastFired = this.cooldown;
      const cursor = this.inputs.cursor;
      if (!cursor) return;

      // TODO: Offset forward slightly
      const position = this.entity.globalTransform.position.bare();
      const direction = cursor.world.sub(position);
      const rotation = Math.atan2(direction.y, direction.x);

      this.entity.game.world.spawn({
        type: Rigidbody2D,
        name: "Bullet",
        transform: { position, rotation, scale: { x: 0.25, y: 0.15 } },
        behaviors: [{ type: BulletBehavior, values: { speed: 75 } }],
        values: { type: "fixed" },
        children: [
          {
            type: Sprite2D,
            name: "BulletSprite",
          },
        ],
      });
    }
  }
}

// #region Astroid
class AstroidMovement extends Behavior {
  speed = 0.2;
  direction = new Vector2(Math.random() * 2 - 1, Math.random() * 2 - 1).normalize();

  onTick(): void {
    this.entity.transform.position = this.entity.transform.position.add(
      this.direction.mul((this.time.delta / 100) * this.speed),
    );
  }
}

class AstroidExplosionPieceBehavior extends Behavior {
  private timer = 0;
  private readonly lifetime = 1;
  private direction: Vector2;

  constructor(ctx: BehaviorContext) {
    super(ctx);
    this.direction = new Vector2(Math.random() * 2 - 1, Math.random() * 2 - 1).normalize();
  }

  onTick(): void {
    const speed = 2;
    this.entity.transform.position = this.entity.transform.position.add(
      this.direction.mul((this.time.delta / 1000) * speed),
    );

    this.timer += this.time.delta / 1000;
    if (this.timer >= this.lifetime) {
      this.entity.destroy();
    }
  }
}

class AstroidBehavior extends Behavior {
  private healthBar!: HealthBar;

  onInitialize(): void {
    const health = Math.floor(Math.random() * 3) + 3;
    this.healthBar = this.entity.addBehavior({
      type: HealthBar,
      values: {},
    }) as HealthBar;

    this.healthBar.initialize(health);

    this.listen(this.entity, EntityCollision, e => {
      if (e.started) this.onCollide(e.other);
    });
  }
  onCollide(other: Entity) {
    if (!other.name.startsWith("Bullet")) return;

    other.destroy();
    this.healthBar.takeDamage(1);
  }

  spawnExplosionPieces(): void {
    const pieceCount = Math.random() * 5 + 3;
    const pieceSize = { x: 0.15, y: 0.15 };

    for (let i = 0; i < pieceCount; i++) {
      this.entity.game.world.spawn({
        type: Rigidbody2D,
        name: "AstroidExplosionPiece",
        transform: {
          position: this.entity.transform.position.clone(),
          scale: pieceSize,
        },
        behaviors: [{ type: AstroidExplosionPieceBehavior }],
        children: [
          {
            type: Sprite2D,
            name: "AstroidPieceSprite",
            values: { texture: "https://files.codedred.dev/astroid.png" },
          },
        ],
      });
    }
  }
}

const prefabAstroid = game.prefabs.spawn({
  type: Rigidbody2D,
  name: "Astroid",
  behaviors: [{ type: AstroidMovement }, { type: AstroidBehavior }],
  values: { type: "fixed" },
  children: [
    {
      type: Sprite2D,
      name: "AstroidSprite",
      values: { texture: "https://files.codedred.dev/astroid.png" },
    },
  ],
});

const spawnAstroid = () => {
  const player = game.world.children.get("Player");
  if (!player) return;

  const playerPos = player.globalTransform.position;
  const rotation = player.transform.rotation;
  const forward = new Vector2(-Math.sin(rotation), Math.cos(rotation));

  const spawnDistance = 30;
  const spawnPosition = playerPos.add(forward.mul(spawnDistance));

  prefabAstroid.cloneInto(game.world, { transform: { position: spawnPosition } });
};

const spawnAsteroids = () => {
  const numAsteroids = Math.floor(Math.random() * 5) + 1;
  for (let i = 0; i < numAsteroids; i++) {
    spawnAstroid();
  }

  const nextSpawnInterval = Math.random() * 5000 + 2000;
  setTimeout(spawnAsteroids, nextSpawnInterval);
};

spawnAsteroids();

// #region Enemy
class EnemyMovement extends Behavior {
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
          type: Sprite2D,
          name: "BulletSprite",
          transform: {
            scale: { x: 0.5, y: 0.5 },
          },
        },
      ],
    });
  }
}

class ExplosionPieceBehavior extends Behavior {
  private timer = 0;
  private readonly lifetime = 1;
  private direction: Vector2;

  constructor(ctx: BehaviorContext) {
    super(ctx);
    this.direction = new Vector2(Math.random() * 2 - 1, Math.random() * 2 - 1).normalize();
  }

  onTick(): void {
    const speed = 2;
    this.entity.transform.position = this.entity.transform.position.add(
      this.direction.mul((this.time.delta / 1000) * speed),
    );

    this.timer += this.time.delta / 1000;
    if (this.timer >= this.lifetime) {
      this.entity.destroy();
    }
  }
}

class EnemyBehavior extends Behavior {
  private healthBar!: HealthBar;

  onInitialize(): void {
    const health = Math.floor(Math.random() * 3) + 3;
    this.healthBar = this.entity.addBehavior({
      type: HealthBar,
      values: {},
    }) as HealthBar;

    this.healthBar.initialize(health);

    this.listen(this.entity, EntityCollision, e => {
      if (e.started) this.onCollide(e.other);
    });
  }

  onCollide(other: Entity) {
    if (!other.name.startsWith("Bullet")) return;

    other.destroy();
    this.healthBar.takeDamage(1);
  }
}

const prefabEnemy = game.prefabs.spawn({
  type: Rigidbody2D,
  name: "Enemy",
  behaviors: [{ type: EnemyMovement }, { type: EnemyBehavior }],
  values: { type: "fixed" },
  children: [
    {
      type: Sprite2D,
      name: "EnemySprite",
      values: { texture: "https://files.codedred.dev/enemy.png" },
    },
  ],
});

const spawnEnemy = () => {
  const player = game.world.children.get("Player");
  if (!player) return;

  const playerPos = player.globalTransform.position;
  const rotation = player.transform.rotation;

  const randomSign1 = Math.random() < 0.5 ? -1 : 1;
  const randomSign2 = Math.random() < 0.5 ? -1 : 1;

  const forward = new Vector2(
    randomSign1 * Math.sin(rotation),
    randomSign2 * Math.cos(rotation),
  );

  const spawnDistance = 20;
  const spawnPosition = playerPos.add(forward.mul(spawnDistance));

  prefabEnemy.cloneInto(game.world, { transform: { position: spawnPosition } });
};

setInterval(spawnEnemy, 5000);

// #region background
export const background = game.local.spawn({
  type: TilingSprite2D,
  name: "Background",
  values: {
    texture: "https://files.lulu.dev/ydQdgTIPWW73.png",
    width: 150,
    height: 150,
    tileScale: Vector2.splat(1 / 3),
  },
  behaviors: [{ type: BackgroundBehavior, values: { parallax: Vector2.splat(0.5) } }],
});

// #region player
class PlayerBehavior extends Behavior {
  onInitialize(): void {
    this.listen(this.entity, EntityCollision, e => {
      if (e.started) this.onCollide(e.other);
    });
  }

  onCollide(other: Entity) {
    if (!other.name.startsWith("EnemyBullet")) return;

    other.destroy();
    // TODO: player takes damage
  }
}

export const player = game.world.spawn({
  type: Rigidbody2D,
  name: "Player",
  behaviors: [
    { type: Movement },
    { type: LookAtMouse },
    { type: ClickFire },
    { type: PlayerBehavior },
  ],
  transform: { position: { x: 1, y: 1 }, scale: { x: 1.25, y: 1.25 } },
  values: { type: "fixed" },
  children: [
    { type: Empty, name: "CameraTarget", transform: { position: { x: 0, y: 1 } } },
    {
      type: Sprite2D,
      name: "PlayerSprite",
      values: { texture: "https://files.codedred.dev/spaceship.png" },
    },
  ],
});

camera.transform.scale = Vector2.splat(3);
camera.smooth = 0.05;

// Follow player without inheriting rotation
const cameraTarget = player._.CameraTarget;
game.on(GamePostRender, () => {
  camera.pos.assign(cameraTarget.pos);
});

game.physics.world.gravity = { x: 0, y: 0 };
