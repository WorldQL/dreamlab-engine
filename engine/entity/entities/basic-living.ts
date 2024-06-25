import { Entity } from "../entity.ts";
import { EntityUpdate } from "../../signals/entity-updates.ts";

export class BasicLivingEntity extends Entity {
  maxHealth = 100.0;
  health = this.maxHealth;

  onInitialize(): void {
    this.defineValues(BasicLivingEntity, "maxHealth", "health");

    this.on(EntityUpdate, () => this.regen());
  }

  regen() {
    if (this.health < this.maxHealth) {
      this.health += Math.min(10.0 / this.game.time.TPS, this.maxHealth - this.health);
    }
  }
}
Entity.registerType(BasicLivingEntity, "@core");
