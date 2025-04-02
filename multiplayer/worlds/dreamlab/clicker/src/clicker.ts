import {
  Behavior,
  Clickable,
  Entity,
  EntityByRefAdapter,
  MouseDown,
  Sprite,
  Vector2,
  syncedValue,
} from "@dreamlab/engine";
import UpgradesManager from "./upgrades.ts";
import GlobalStats from "./global-stats.ts";
import { ParticleEmitEvent } from "./particles.ts";

export default class ClickableBehavior extends Behavior {
  #clickable: Clickable;
  private isClicked = false;
  private effectTimer = 0;
  private originalScale = { x: 1, y: 1 };

  @syncedValue(EntityByRefAdapter)
  upgradesManager: Entity | undefined;

  onInitializeClient(): void {
    this.#clickable = this.entity.cast(Clickable);
    this.listen(this.#clickable, MouseDown, ({ button }) => {
      if (button !== "left") return;
      const player = this.game.network.connections.find(
        (conn) => conn.id === this.game.network.self,
      );
      if (!player) return;

      const globalStatsEntity = this.game.world._.GlobalStats;
      const globalStatsBehavior = globalStatsEntity.getBehavior(GlobalStats);
      const currentPlanet = globalStatsBehavior.currentPlanet || "Earth";

      // Check if the planet is unlocked for this player.
      if (
        !globalStatsBehavior.purchasedPlanets[player.playerId] ||
        !globalStatsBehavior.purchasedPlanets[player.playerId][currentPlanet]
      ) {
        console.log("Planet locked! Purchase it first.");
        return;
      }

      const manager = this.upgradesManager?.getBehavior(UpgradesManager);
      const multiplier = manager
        ? manager.getAggregatedStats(player.playerId, currentPlanet).clickMultiplier
        : 1;

      this.game.network.sendCustomMessage("server", "@clicker/click", {
        playerId: player.playerId,
        nickname: player.nickname || "Unknown",
        multiplier,
        planet: currentPlanet,
      });

      if (!this.isClicked) {
        this.startClickEffect();
        const offsetRange = 3;
        const offset = new Vector2(
          (Math.random() - 0.5) * offsetRange,
          (Math.random() - 0.5) * offsetRange,
        );
        const spawnPosition = this.entity.transform.position.clone().add(offset);
        this.game.fire(
          ParticleEmitEvent,
          spawnPosition,
          5 + Math.floor(Math.random() * 5),
          `+${multiplier}⚡`,
        );
      }
    });
  }

  private startClickEffect(): void {
    const sprite = this.entity._.Sprite.cast(Sprite);
    if (!sprite) return;
    this.isClicked = true;
    this.effectTimer = 150;
    this.originalScale = this.entity.transform.scale;
    sprite.alpha = 0.5;
    this.entity.transform.scale = {
      x: this.originalScale.x * 0.8,
      y: this.originalScale.y * 0.8,
    };
  }

  onTickClient(): void {
    const rotationSpeed = 0.15;
    this.entity.transform.rotation += rotationSpeed * -(this.time.delta / 1000);

    if (this.isClicked) {
      const sprite = this.entity._.Sprite.cast(Sprite);
      if (!sprite) return;
      this.effectTimer -= this.time.delta;
      if (this.effectTimer <= 0) {
        sprite.alpha = 1;
        this.entity.transform.scale = this.originalScale;
        this.isClicked = false;
      }
    }
  }
}
