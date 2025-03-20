import {
  Behavior,
  ClickableEntity,
  MouseDown,
  Sprite,
  syncedValue,
  EntityByRefAdapter,
  Entity,
  Vector2,
} from "@dreamlab/engine";
import UpgradesManager from "./upgrades.ts";
import { ParticleEmitEvent } from "./cookie-particles.ts";

export class CookieClickEvent {
  constructor(public auto: boolean) {}
}

export default class ClickableColorChanger extends Behavior {
  #clickable: ClickableEntity;
  private isClicked: boolean = false;
  private effectTimer: number = 0;
  private originalScale = { x: 1, y: 1 };
  private cookieIndex: number = 2;

  @syncedValue(EntityByRefAdapter)
  upgradesManager: Entity | undefined;

  onInitialize(): void {
    this.#clickable = this.entity.cast(ClickableEntity);

    const click = (autoClicked = false) => {
      const player = this.game.network.connections.find(
        (conn) => conn.id === this.game.network.self,
      );

      if (!player) return;

      // Apply click multiplier if available
      const manager = this.upgradesManager?.getBehavior(UpgradesManager);
      const multiplier = manager?.clickMultiplierValue || 1;

      this.game.network.sendCustomMessage("server", "@cookie/click", {
        playerId: player.playerId,
        nickname: player.nickname || "Unknown",
        multiplier: multiplier,
      });

      if (!this.isClicked && !autoClicked) {
        // Update sprite texture each time we click.
        const sprite = this.entity._.Sprite.cast(Sprite);
        sprite.texture = `res://assets/cookie-${this.cookieIndex}.png`;
        // Increment counter and loop back to 1 after 15.
        this.cookieIndex = (this.cookieIndex % 15) + 1;

        this.startClickEffect();
      }
    };

    // Handle manual clicks
    this.listen(this.#clickable, MouseDown, ({ button }) => {
      if (button !== "left") return;
      click();
    });

    // Handle auto clicks via events
    this.game.on(CookieClickEvent, (event: CookieClickEvent) => {
      click(event.auto);

      // Emit particles for auto clicks
      if (event.auto && this.game.isClient()) {
        // Get the cookie's position
        const position = this.entity.transform.position.clone();

        // Emit enhanced particles for auto clicks (more particles, marked as auto-click)
        this.game.fire(
          ParticleEmitEvent,
          position,
          5 + Math.floor(Math.random() * 5), // 5-9 particles
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

  onTick(): void {
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
