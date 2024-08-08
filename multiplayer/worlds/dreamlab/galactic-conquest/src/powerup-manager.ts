import { Behavior, Rigidbody2D, Sprite2D } from "@dreamlab/engine";
import { MAP_BOUNDARY } from "./_constants.ts";
import GoldAsteroidBehavior from "./power-ups/gold-asteroid.ts";
import { PowerUpType } from "./power-ups/mod.ts";

const powerUpTextures = "res://assets/gold-asteroid.png";

export default class PowerUpManager extends Behavior {
  onInitialize(): void {
    this.#maintainPowerUps();
  }

  #spawnPowerUp() {
    const x = Math.random() * (MAP_BOUNDARY * 2) - MAP_BOUNDARY;
    const y = Math.random() * (MAP_BOUNDARY * 2) - MAP_BOUNDARY;
    const position = { x, y };

    if (isNaN(x) || isNaN(y)) return;

    const type = Math.floor((Math.random() * Object.keys(PowerUpType).length) / 2);

    const powerUp = this.game.world.spawn({
      type: Rigidbody2D,
      name: "PowerUp",
      transform: { position, scale: { x: 2, y: 2 } },
      behaviors: [{ type: GoldAsteroidBehavior }],
      values: { type: "fixed" },
      children: [
        {
          type: Sprite2D,
          name: "PowerUpSprite",
          values: { texture: powerUpTextures },
        },
      ],
    });

    const powerUpBehavior = powerUp.getBehavior(GoldAsteroidBehavior);
    powerUpBehavior.type = type;
  }

  #maintainPowerUps() {
    const existingPowerUps = [...this.game.world.children.values()].filter(e =>
      e.name.startsWith("PowerUp"),
    ).length;

    if (existingPowerUps < 10) this.#spawnPowerUp();

    setTimeout(() => {
      this.#maintainPowerUps();
    }, Math.random() * 5000 + 2000);
  }
}
