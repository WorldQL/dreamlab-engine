import {
  AnimatedSprite,
  Behavior,
  Clickable,
  Entity,
  EntityByRefAdapter,
  MouseDown,
  ObjectAdapter,
  syncedValue,
} from "@dreamlab/engine";
import UpgradesManager from "./upgrades.ts";
import { ParticleEmitEvent } from "./particles.ts";
import GlobalStats from "./global-stats.ts";

export default class RocketShipBehavior extends Behavior {
  #clickable: Clickable;
  private isClicked = false;
  private effectTimer = 0;
  private originalScale = { x: 1, y: 1 };

  @syncedValue(EntityByRefAdapter)
  upgradesManager: Entity | undefined;

  @syncedValue(ObjectAdapter)
  direction: { x: number; y: number } = { x: 1, y: 0 };

  private baseSpeed: number = 1;
  private boostSpeed: number = 4;
  private boostTimer: number = 0;

  onInitializeClient(): void {
    this.#clickable = this.entity.cast(Clickable);
    this.listen(this.#clickable, MouseDown, ({ button }) => {
      if (button !== "left") return;
      const player = this.game.network.connections.find(
        (conn) => conn.id === this.game.network.self,
      );
      if (!player) return;

      const globalStats = this.game.world._.GlobalStats.getBehavior(GlobalStats);
      const currentPlanet = globalStats.currentPlanet || "Earth";
      const manager = this.upgradesManager?.getBehavior(UpgradesManager);
      const multiplier = manager
        ? manager.getAggregatedStats(player.playerId, currentPlanet).clickMultiplier
        : 1;

      this.game.network.sendCustomMessage("server", "@clicker/click", {
        playerId: player.playerId,
        nickname: player.nickname || "Unknown",
        multiplier: multiplier * 10,
      });

      this.boostTimer = 300;

      if (!this.isClicked) {
        this.startClickEffect();
        const position = this.entity.globalTransform.position.clone();
        this.game.fire(ParticleEmitEvent, position, 2, `+${multiplier * 10}⚡`);
      }
    });
  }

  private startClickEffect(): void {
    const sprite = this.entity._.AnimatedSprite.cast(AnimatedSprite);
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
    const dtSeconds = this.time.delta / 1000;

    let currentSpeed = this.baseSpeed;
    if (this.boostTimer > 0) {
      currentSpeed += this.boostSpeed;
      this.boostTimer -= this.time.delta;
      if (this.boostTimer < 0) this.boostTimer = 0;
    }

    // Move rocket ship.
    this.entity.transform.position.x += this.direction.x * currentSpeed * dtSeconds;
    this.entity.transform.position.y += this.direction.y * currentSpeed * dtSeconds;

    // Rotate rocket ship.
    const angle = Math.atan2(this.direction.y, this.direction.x) + Math.PI / 2;
    this.entity.transform.rotation = angle;

    const pos = this.entity.transform.position;
    const cameraPos = this.game.local!._.Camera.pos;
    const viewWidth = 20;
    const viewHeight = 20;
    const halfWidth = viewWidth / 2;
    const halfHeight = viewHeight / 2;
    const extraMargin = 2;

    // Only destroy if rocket is too far outside of the camera view.
    if (
      pos.x < cameraPos.x - halfWidth - extraMargin ||
      pos.x > cameraPos.x + halfWidth + extraMargin ||
      pos.y < cameraPos.y - halfHeight - extraMargin ||
      pos.y > cameraPos.y + halfHeight + extraMargin
    ) {
      this.entity.destroy();
      return;
    }

    if (this.isClicked) {
      const sprite = this.entity._.AnimatedSprite.cast(AnimatedSprite);
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
