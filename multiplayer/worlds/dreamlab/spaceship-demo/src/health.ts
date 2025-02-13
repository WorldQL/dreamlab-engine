import {
  Behavior,
  Entity,
  EntityDestroyed,
  Sprite,
  Vector2,
  syncedValue,
} from "@dreamlab/engine";

export default class HealthBar extends Behavior {
  @syncedValue()
  maxHealth: number = 100;
  @syncedValue()
  currentHealth: number = 100;
  @syncedValue()
  runsOn: "server" | "client" = "client";
  healthBar!: Entity;

  canRunHere(): boolean {
    if (
      this.runsOn === "client" &&
      this.game.isClient() &&
      this.entity.authority === this.game.network.self
    ) {
      return true;
    }
    if (this.runsOn === "server" && this.game.isServer()) {
      return true;
    }
    return false;
  }

  onInitialize(): void {
    if (!this.canRunHere()) return;

    this.healthBar = this.entity.game.world.spawn({
      type: Sprite,
      name: "HealthBar",
      transform: { position: { x: 0, y: 1 }, scale: { x: 1, y: 0.1 } },
      values: { texture: "res://assets/healthbar.png" },
    });

    this.listen(this.entity, EntityDestroyed, () => {
      this.healthBar.destroy();
    });
  }

  onPostTick() {
    if (!this.canRunHere()) return;
    this.healthBar.pos = this.entity.transform.position.add(new Vector2(0, 1));
    this.updateHealthBar();
  }

  updateHealthBar(): void {
    const healthRatio = this.currentHealth / this.maxHealth;
    this.healthBar.transform.scale.x = healthRatio;
  }

  takeDamage(damage: number): void {
    this.currentHealth -= damage;
    if (this.currentHealth <= 0) {
      this.currentHealth = 0;
      this.entity.destroy();
      this.healthBar.destroy();
    }
    this.updateHealthBar();
  }
}
