import { BackgroundBehavior } from "../../behavior/behaviors/background-behavior.ts";
import { Behavior } from "../../behavior/mod.ts";
import { Empty, Entity, Sprite2D, TilingSprite2D, Rigidbody2D } from "../../entity/mod.ts";
import { Vector2 } from "../../math/mod.ts";
import { EntityCollision, GamePostRender } from "../../signals/mod.ts";

class Movement extends Behavior {
  speed = 1.0;

  #up = this.inputs.create("@wasd/up", "Move Up", "KeyW");
  #down = this.inputs.create("@wasd/down", "Move Down", "KeyS");
  #left = this.inputs.create("@wasd/left", "Move Left", "KeyA");
  #right = this.inputs.create("@wasd/right", "Move Right", "KeyD");
  #shift = this.inputs.create("@wasd/shift", "Speed Boost", "ShiftLeft");

  onInitialize(): void {
    this.value(Movement, "speed");
  }

  onTick(): void {
    const movement = new Vector2(0, 0);
    let currentSpeed = this.speed;

    if (this.#shift.held) currentSpeed *= 2;

    if (this.#up.held) movement.y += 1;
    if (this.#down.held) movement.y -= 1;
    if (this.#right.held) movement.x += 1;
    if (this.#left.held) movement.x -= 1;

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

  cooldown = 5; // ticks
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
    },
  ],
});

const spawnEnemy = () => {
  const x = Math.random() * 10 - 5;
  const y = Math.random() * 10 - 5;

  prefabEnemy.cloneInto(game.world, { transform: { position: { x, y } } });
};

setInterval(spawnEnemy, 5000);

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
  values: { texture: "https://files.lulu.dev/QPFuCn7T_YZE.svg" },
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
