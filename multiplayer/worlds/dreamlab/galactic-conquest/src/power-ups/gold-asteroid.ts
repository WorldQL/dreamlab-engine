import { Behavior, Entity, EntityCollision } from "@dreamlab/engine";
import HealthBar from "../health-bar.ts";
import { PowerUpType } from "./mod.ts";
import PlayerBehavior from "../player.ts";

export default class GoldAsteroidBehavior extends Behavior {
  private healthBar!: HealthBar;
  type!: PowerUpType;

  onInitialize(): void {
    const health = 100;
    this.healthBar = this.entity.addBehavior({
      type: HealthBar,
      values: { currentHealth: health, maxHealth: health },
    });

    this.listen(this.entity, EntityCollision, e => {
      if (e.started) this.onCollide(e.other);
    });
  }

  onCollide(other: Entity) {
    if (other.name.startsWith("Bullet")) {
      other.destroy();
      this.healthBar.takeDamage(1);
      if (this.healthBar.currentHealth <= 0) {
        const player = this.entity.game.world.children.get("Player");
        if (player) {
          this.grantPowerUp(player);
        }
        this.entity.destroy();
      }
    }
  }

  grantPowerUp(player: Entity) {
    const playerBehavior = player.getBehavior(PlayerBehavior);
    switch (this.type) {
      case PowerUpType.ScatterShot:
        playerBehavior.activateScatterShot();
        break;
      case PowerUpType.DoubleShot:
        playerBehavior.activateDoubleShot();
        break;
      case PowerUpType.BackwardsShot:
        playerBehavior.activateBackwardsShot();
        break;
      case PowerUpType.SideShot:
        playerBehavior.activateSideShot();
        break;
      case PowerUpType.SpiralShot:
        playerBehavior.activateSpiralShot();
        break;
    }
  }
}
