import { Behavior, BehaviorContext } from "../../../../behavior/mod.ts";
import { Entity, Rigidbody2D, Sprite } from "../../../../entity/mod.ts";
import { Vector2 } from "../../../../math/mod.ts";
import { EntityCollision } from "../../../../signals/mod.ts";
import { HealthBar } from "../behaviors/health-bar.ts";
import { MAP_BOUNDARY } from "../map/map.ts";
import { PlayerBehavior } from "./player.ts";

export class AsteroidMovement extends Behavior {
  readonly #direction = new Vector2(Math.random() * 2 - 1, Math.random() * 2 - 1).normalize();

  speed = 0.2;

  constructor(ctx: BehaviorContext) {
    super(ctx);
    this.defineValues(AsteroidMovement, "speed");
  }

  onTick(): void {
    this.entity.transform.position = this.entity.transform.position.add(
      this.#direction.mul((this.time.delta / 100) * this.speed),
    );
  }
}

export class AsteroidBehavior extends Behavior {
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
      player.getBehavior(PlayerBehavior).score += 50;
    }
  }
}

const prefabAsteroid = game.prefabs.spawn({
  type: Rigidbody2D,
  name: "Asteroid",
  behaviors: [{ type: AsteroidMovement }, { type: AsteroidBehavior }],
  values: { type: "fixed" },
  children: [
    {
      type: Sprite,
      name: "AsteroidSprite",
      values: { texture: "https://files.codedred.dev/asteroid.png" },
    },
  ],
});

export function spawnAsteroid() {
  const player = game.world.children.get("Player");
  if (!player) return;

  const spawnDistance = 40;
  const spawnAngle = Math.random() * 2 * Math.PI;

  const spawnPosition = player.transform.position.add(
    new Vector2(Math.cos(spawnAngle) * spawnDistance, Math.sin(spawnAngle) * spawnDistance),
  );

  spawnPosition.x = Math.max(-MAP_BOUNDARY, Math.min(MAP_BOUNDARY, spawnPosition.x));
  spawnPosition.y = Math.max(-MAP_BOUNDARY, Math.min(MAP_BOUNDARY, spawnPosition.y));

  prefabAsteroid.cloneInto(game.world, { transform: { position: spawnPosition } });
}

export function spawnAsteroids() {
  const numAsteroids = Math.floor(Math.random() * 5) + 1;
  for (let i = 0; i < numAsteroids; i++) {
    spawnAsteroid();
  }

  const nextSpawnInterval = Math.random() * 5000 + 2000;
  setTimeout(spawnAsteroids, nextSpawnInterval);
}

spawnAsteroids();
