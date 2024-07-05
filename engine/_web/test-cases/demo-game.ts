import { Behavior, Sprite2D, Vector2 } from "../../mod.ts";

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
  private timer = 0;
  private readonly lifetime = 3;

  onTick(): void {
    const speed = (this.time.delta / 1000) * 20;
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

  onTick(): void {
    if (this.fire.pressed) {
      // TODO: Offset forward slightly
      const cursor = this.inputs.cursor;
      if (!cursor) return;

      const position = this.entity.globalTransform.position.bare();
      const direction = cursor.world.sub(position);
      const rotation = Math.atan2(direction.y, direction.x);

      game.world.spawn({
        type: Sprite2D,
        name: "Bullet",
        transform: { position, rotation, scale: { x: 0.2, y: 0.2 } },
        behaviors: [{ type: BulletBehaviour }],
      });
    }
  }
}

export const player = game.world.spawn({
  type: Sprite2D,
  name: "Player",
  behaviors: [{ type: Movement }, { type: LookAtMouse }, { type: ClickFire }],
  transform: { position: { x: 1, y: 1 } },
});
