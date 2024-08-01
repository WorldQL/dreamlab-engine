import { Behavior, BehaviorContext } from "../../../../behavior/mod.ts";
import { Entity, Sprite2D } from "../../../../entity/mod.ts";
import { GamePostRender } from "../../../../signals/mod.ts";
import { PlayerBehavior } from "../entities/player.ts";
import { PlayerUI } from "../ui/player-ui.ts";

export class Shield extends Behavior {
  #shieldKey = this.inputs.create("@ability/shield", "Shield", "Space");
  shieldDuration = 5000;
  cooldown = 15000;
  #shieldActive = false;
  #coolingDown = false;
  coolingDownTime = 0;
  #shieldEffect!: Entity;

  constructor(ctx: BehaviorContext) {
    super(ctx);
  }

  get isCoolingDown(): boolean {
    return this.#coolingDown;
  }

  onUpdate(): void {
    if (this.#shieldKey.pressed && !this.#shieldActive && !this.#coolingDown) {
      this.#activateShield();
    }
  }

  #activateShield() {
    this.#shieldActive = true;
    this.entity.getBehavior(PlayerBehavior).invincible = true;
    this.#shieldEffect = this.entity.game.world.spawn({
      type: Sprite2D,
      name: "ShieldEffect",
      transform: {
        position: this.entity.transform.position.clone(),
        scale: { x: 2.0, y: 2.0 },
      },
      values: { texture: "https://files.codedred.dev/shield.png" },
    });

    this.entity.game.on(GamePostRender, this.#updateShieldEffectPosition);

    this.#updateShieldUI(this.shieldDuration);

    setTimeout(() => {
      this.entity.getBehavior(PlayerBehavior).invincible = false;
      this.#shieldEffect.destroy();
      this.entity.game.unregister(GamePostRender, this.#updateShieldEffectPosition);
      this.#shieldActive = false;
      this.#coolDown();
    }, this.shieldDuration);
  }

  #updateShieldEffectPosition = () => {
    if (this.#shieldEffect) {
      this.#shieldEffect.transform.position = this.entity.transform.position;
    }
  };

  async #coolDown() {
    this.#coolingDown = true;
    this.coolingDownTime = Date.now();
    this.#updateShieldUI(0);
    await new Promise(resolve => setTimeout(resolve, this.cooldown));
    this.#coolingDown = false;
  }

  #updateShieldUI(duration: number) {
    const ui = this.entity._.UI.getBehavior(PlayerUI);
    ui.updateShieldDuration(duration);
  }
}
