import { Behavior, Entity, EntityCollision } from "@dreamlab/engine";
import HealthBar from "./health-bar.ts";
import PlayerBehavior from "./player.ts";

export default class AsteroidBehavior extends Behavior {
  private healthBar!: HealthBar;

  onInitialize(): void {
    const health = Math.floor(Math.random() * 3) + 3;
    this.healthBar = this.entity.addBehavior({
      type: HealthBar,
      values: { maxHealth: health, currentHealth: health },
    });

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
