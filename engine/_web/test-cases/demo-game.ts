import { BackgroundBehavior } from "../../behavior/behaviors/background-behavior.ts";
import { Behavior } from "../../behavior/mod.ts";
import { Empty, Entity, Sprite2D, TilingSprite2D, Rigidbody2D } from "../../entity/mod.ts";
import { Vector2 } from "../../math/mod.ts";
import { EntityCollision, GamePostRender } from "../../signals/mod.ts";

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
  speed: number = 75;

  private timer = 0;
  private readonly lifetime = 3;

  onTick(): void {
    const speed = (this.time.delta / 1000) * this.speed;
    const rotation = this.entity.transform.rotation;
    const direction = new Vector2(Math.cos(rotation), Math.sin(rotation)).mul(speed);
    this.entity.transform.position.assign(this.entity.transform.position.add(direction));

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

      game.world.spawn({
        type: Rigidbody2D,
        name: "Bullet",
        transform: { position, rotation, scale: { x: 0.25, y: 0.15 } },
        behaviors: [{ type: BulletBehavior }],
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
// #region astroid
class AstroidMovement extends Behavior {
  speed = 0.2;
  direction = new Vector2(Math.random() * 2 - 1, Math.random() * 2 - 1).normalize();

  onTick(): void {
    this.entity.transform.position = this.entity.transform.position.add(
      this.direction.mul((this.time.delta / 100) * this.speed),
    );
  }
}

class AstroidBehavior extends Behavior {
  onInitialize(): void {
    this.listen(this.entity, EntityCollision, e => {
      if (e.started) this.onCollide(e.other);
    });
  }

  onCollide(other: Entity) {
    if (!other.name.startsWith("Bullet")) return;

    other.destroy();
    this.entity.destroy();
  }
}

const prefabAstroid = game.prefabs.spawn({
  type: Rigidbody2D,
  name: "Astroid",
  behaviors: [{ type: AstroidMovement }, { type: AstroidBehavior }],
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

  const spawnDistance = 40;
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
  speed = 0.5;

  onTick(): void {
    const player = game.world.children.get("Player");
    const playerPos = player?.globalTransform.position;
    if (!playerPos) return;

    const direction = playerPos.sub(this.entity.transform.position).normalize();
    this.entity.transform.position = this.entity.transform.position.add(
      direction.mul((this.time.delta / 100) * this.speed),
    );

    const rotation = Math.atan2(direction.y, direction.x);
    this.entity.transform.rotation = rotation - Math.PI / 2;
  }
}

class EnemyBehavior extends Behavior {
  onInitialize(): void {
    this.listen(this.entity, EntityCollision, e => {
      if (e.started) this.onCollide(e.other);
    });
  }

  onCollide(other: Entity) {
    if (!other.name.startsWith("Bullet")) return;

    other.destroy();
    this.entity.destroy();
  }
}

const prefabEnemy = game.prefabs.spawn({
  type: Rigidbody2D,
  name: "Enemy",
  behaviors: [{ type: EnemyMovement }, { type: EnemyBehavior }],
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

// #region game
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

export const player = game.world.spawn({
  type: Sprite2D,
  name: "Player",
  values: { texture: "https://files.codedred.dev/spaceship.png" },
  behaviors: [{ type: Movement }, { type: LookAtMouse }, { type: ClickFire }],
  transform: { position: { x: 1, y: 1 }, scale: { x: 1.25, y: 1.25 } },
  children: [{ type: Empty, name: "CameraTarget", transform: { position: { x: 0, y: 1 } } }],
});

camera.transform.scale = Vector2.splat(3);
camera.smooth = 0.05;

// Follow player without inheriting rotation
const cameraTarget = player._.CameraTarget;
game.on(GamePostRender, () => {
  camera.pos.assign(cameraTarget.pos);
});

game.physics.world.gravity = { x: 0, y: 0 };
