import { Behavior, BehaviorContext } from "../../../../behavior/mod.ts";
import { Entity, Sprite2D } from "../../../../entity/mod.ts";
import { GamePostRender } from "../../../../signals/mod.ts";
import { PlayerBehavior } from "../entities/player.ts";

export class Supercharge extends Behavior {
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

  update(): void {
    if (this.#superchargeKey.pressed && !this.#supercharged && !this.#coolingDown) {
      this.#startSupercharge();
    }
  }

  #startSupercharge() {
    this.#supercharged = true;
    const playerBehavior = this.entity.getBehavior(PlayerBehavior);
    playerBehavior.fireRateMultiplier = 10;

    this.#superchargeEffect = this.entity.game.world.spawn({
      type: Sprite2D,
      name: "SuperchargeEffect",
      transform: {
        position: this.entity.transform.position.clone(),
        rotation: this.entity.transform.rotation,
        scale: { x: 2.5, y: 2.5 },
      },
      values: { texture: "https://files.codedred.dev/supercharge.png" },
    });

    this.entity.game.on(GamePostRender, this.#updateSuperchargeEffectPosition);

    setTimeout(() => {
      playerBehavior.fireRateMultiplier = 1;
      this.#superchargeEffect.destroy();
      this.entity.game.unregister(GamePostRender, this.#updateSuperchargeEffectPosition);
      this.#supercharged = false;
      this.#coolDown();
    }, this.#superchargeDuration);
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
