import { Entity, EntityContext } from "../entity.ts";
import { EntityUpdate } from "../../signals/entity-updates.ts";

export class BasicLivingEntity extends Entity {
  static {
    Entity.registerType(this, "@core");
  }

  maxHealth = 100.0;
  health = this.maxHealth;

  constructor(ctx: EntityContext) {
    super(ctx);
    this.defineValues(BasicLivingEntity, "maxHealth", "health");
  }

  onInitialize(): void {
    this.on(EntityUpdate, () => this.regen());
  }

  regen() {
    if (this.health < this.maxHealth) {
      this.health += Math.min(10.0 / this.game.time.TPS, this.maxHealth - this.health);
    }
  }
}
