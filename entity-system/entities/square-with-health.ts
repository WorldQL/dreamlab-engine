import { Entity, EntityContext } from "../entity.ts";
import { EntityUpdate } from "../signals/entity-updates.ts";
import { SquareEntity } from "./square.ts";

export class SquareWithHealth extends SquareEntity {
  health = this.values.number("health", 100);
  maxHealth = this.values.number("maxHealth", 100);

  constructor(ctx: EntityContext) {
    super(ctx);

    // TODO: weird footgun? requires bind(..) or arrow wrapping if its a member function of the entity
    // maybe we can implicitly bind(..) if the function provided exists in Object.values(this)
    this.on(EntityUpdate, () => this.regen());
  }

  regen() {
    if (this.health.value < this.maxHealth.value) {
      this.health.value += Math.min(
        10.0 / 60.0,
        this.maxHealth.value - this.health.value
      );
    }
  }
}
Entity.registerType(SquareWithHealth, "@core");
