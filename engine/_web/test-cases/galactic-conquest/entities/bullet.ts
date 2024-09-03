import { Behavior, BehaviorContext } from "../../../../behavior/mod.ts";
import { Rigidbody2D, Sprite } from "../../../../entity/mod.ts";
import { Vector2 } from "../../../../math/mod.ts";
import { PlayerBehavior } from "./player.ts";

export class BulletBehavior extends Behavior {
  readonly #lifetime = 3;
  #timer = 0;
  #direction: Vector2;

  speed: number = 35;

  constructor(ctx: BehaviorContext) {
    super(ctx);
    this.defineValues(BulletBehavior, "speed");

    const rotation = this.entity.transform.rotation;
    this.#direction = new Vector2(Math.cos(rotation), Math.sin(rotation));
  }

  onTick(): void {
    const speed = (this.time.delta / 1000) * this.speed;
    this.entity.transform.position.assign(
      this.entity.transform.position.add(this.#direction.mul(speed)),
    );

    this.#timer += this.time.delta / 1000;
    if (this.#timer >= this.#lifetime) {
      this.entity.destroy();
    }
  }
}

export class ClickFire extends Behavior {
  #fire = this.inputs.create("@clickFire/fire", "Fire", "MouseLeft");

  readonly #cooldown = 10; // ticks
  #lastFired = 0;

  onTick(): void {
    if (this.#lastFired > 0) {
      this.#lastFired -= 1;
      return;
    }

    if (this.#fire.held) {
      const playerBehavior = this.entity.getBehavior(PlayerBehavior);
      const fireRateMultiplier = playerBehavior.fireRateMultiplier;

      this.#lastFired = this.#cooldown / fireRateMultiplier;
      const cursor = this.inputs.cursor;
      if (!cursor) return;

      const position = this.entity.globalTransform.position.bare();
      const direction = cursor.world.sub(position);
      const rotation = Math.atan2(direction.y, direction.x);

      this.entity.game.world.spawn({
        type: Rigidbody2D,
        name: "Bullet",
        transform: { position, rotation, scale: { x: 0.25, y: 0.15 } },
        behaviors: [{ type: BulletBehavior }],
        values: { type: "fixed" },
        children: [
          {
            type: Sprite,
            name: "BulletSprite",
          },
        ],
      });
    }
  }
}
