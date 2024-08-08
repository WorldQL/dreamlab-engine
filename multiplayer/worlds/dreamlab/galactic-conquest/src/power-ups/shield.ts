import { Behavior, BehaviorContext, Entity, Sprite2D } from "@dreamlab/engine";
import PlayerBehavior from "../player.ts";
import PlayerUI from "../ui/player-ui.ts";

export default class Shield extends Behavior {
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

  onTick(): void {
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

    setTimeout(() => {
      this.entity.getBehavior(PlayerBehavior).invincible = false;
      this.#shieldEffect.destroy();
      this.#shieldActive = false;
      this.#coolDown();
    }, this.shieldDuration);
  }

  onPostTick() {
    this.#updateShieldUI(this.shieldDuration);
    this.#updateShieldEffectPosition();
  }

  #updateShieldEffectPosition = () => {
    if (this.#shieldEffect) {
      this.#shieldEffect.pos = this.entity.pos;
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
