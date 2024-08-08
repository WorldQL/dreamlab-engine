import { Behavior, BehaviorContext, Entity, Sprite2D } from "@dreamlab/engine";
import PlayerBehavior from "../player.ts";

export default class Supercharge extends Behavior {
  #superchargeKey = this.inputs.create("@ability/supercharge", "Supercharge", "MouseRight");
  #superchargeDuration = 5000;
  cooldown = 30000;
  #supercharged = false;
  #coolingDown = false;
  coolingDownTime = 0;
  #superchargeEffect!: Entity;

  constructor(ctx: BehaviorContext) {
    super(ctx);
  }

  get isCoolingDown(): boolean {
    return this.#coolingDown;
  }

  onTick(): void {
    if (this.#superchargeKey.pressed && !this.#supercharged && !this.#coolingDown) {
      this.#startSupercharge();
    }
  }

  #startSupercharge() {
    this.#supercharged = true;
    const playerBehavior = this.entity.getBehavior(PlayerBehavior);
    const prevFireRate = playerBehavior.fireRateMultiplier;
    playerBehavior.fireRateMultiplier = 10;

    this.#superchargeEffect = this.entity.game.world.spawn({
      type: Sprite2D,
      name: "SuperchargeEffect",
      transform: {
        position: this.entity.transform.position.clone(),
        rotation: this.entity.transform.rotation,
        scale: { x: 2.5, y: 2.5 },
      },
      values: { texture: "res://assets/supercharge.png" },
    });

    setTimeout(() => {
      playerBehavior.fireRateMultiplier = prevFireRate;
      this.#superchargeEffect.destroy();
      this.#supercharged = false;
      this.#coolDown();
    }, this.#superchargeDuration);
  }

  onPostTick() {
    this.#updateSuperchargeEffectPosition();
  }

  #updateSuperchargeEffectPosition = () => {
    if (this.#superchargeEffect) {
      this.#superchargeEffect.transform.position = this.entity.transform.position;
      this.#superchargeEffect.transform.rotation = this.entity.transform.rotation;
    }
  };

  async #coolDown() {
    this.#coolingDown = true;
    this.coolingDownTime = Date.now();
    await new Promise(resolve => setTimeout(resolve, this.cooldown));
    this.#coolingDown = false;
  }
}
