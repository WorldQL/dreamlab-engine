import { Empty, Entity } from "../../entity/mod.ts";
import { Behavior, Sprite2D, Vector2 } from "../../mod.ts";
import { EntityCollision, GamePostRender } from "../../signals/mod.ts";

class Movement extends Behavior {
  speed = 1.0;

  #up = this.inputs.create("@wasd/up", "Move Up", "KeyW");
  #down = this.inputs.create("@wasd/down", "Move Down", "KeyS");
  #left = this.inputs.create("@wasd/left", "Move Left", "KeyA");
  #right = this.inputs.create("@wasd/right", "Move Right", "KeyD");

  onInitialize(): void {
    this.value(Movement, "speed");
  }

  onTick(): void {
    const movement = new Vector2(0, 0);
    if (this.#up.held) movement.y += 1;
    if (this.#down.held) movement.y -= 1;
    if (this.#right.held) movement.x += 1;
    if (this.#left.held) movement.x -= 1;

    this.entity.transform.position = this.entity.transform.position.add(
      movement.normalize().mul((this.time.delta / 100) * this.speed),
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

class BulletBehaviour extends Behavior {
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
        type: Sprite2D,
        name: "Bullet",
        transform: { position, rotation, scale: { x: 0.25, y: 0.15 } },
        behaviors: [{ type: BulletBehaviour }],
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
    if (other.name !== "Bullet") return;

    this.entity.destroy();
  }
}

const spawnEnemy = () => {
  const x = Math.random() * 10 - 5;
  const y = Math.random() * 10 - 5;
  game.world.spawn({
    type: Sprite2D,
    name: "Enemy",
    transform: { position: { x, y } },
    behaviors: [{ type: EnemyMovement }, { type: EnemyBehavior }],
  });
};

setInterval(spawnEnemy, 5000);

export const player = game.world.spawn({
  type: Sprite2D,
  name: "Player",
  behaviors: [{ type: Movement }, { type: LookAtMouse }, { type: ClickFire }],
  transform: { position: { x: 1, y: 1 } },
  children: [{ type: Empty, name: "CameraTarget", transform: { position: { x: 0, y: 1 } } }],
});

camera.transform.scale = Vector2.splat(5);
camera.smooth = 0.05;

// Follow player without inheriting rotation
const cameraTarget = player._.CameraTarget;
game.on(GamePostRender, () => {
  camera.pos.assign(cameraTarget.pos);
});
