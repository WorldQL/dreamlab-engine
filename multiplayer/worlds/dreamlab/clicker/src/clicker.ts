import {
  Behavior,
  Clickable,
  ColoredSquare,
  Entity,
  EntityByRefAdapter,
  MouseDown,
  syncedValue,
} from "@dreamlab/engine";
import UpgradesManager from "./upgrades.ts";

export class ClickEvent {
  constructor(public auto: boolean) {}
}

export default class ClickableBehavior extends Behavior {
  #clickable: Clickable;
  private isClicked: boolean = false;
  private effectTimer: number = 0;
  private originalScale = { x: 1, y: 1 };

  @syncedValue(EntityByRefAdapter)
  upgradesManager: Entity | undefined;

  onInitialize(): void {
    this.#clickable = this.entity.cast(Clickable);

    const click = (autoClicked = false) => {
      const player = this.game.network.connections.find(
        (conn) => conn.id === this.game.network.self,
      );

      if (!player) return;

      // Apply click multiplier if available
      const manager = this.upgradesManager?.getBehavior(UpgradesManager);
      const multiplier = manager?.clickMultiplierValue || 1;

      this.game.network.sendCustomMessage("server", "@clicker/click", {
        playerId: player.playerId,
        nickname: player.nickname || "Unknown",
        multiplier: multiplier,
      });

      if (!this.isClicked && !autoClicked) this.startClickEffect();
    };

    this.listen(this.#clickable, MouseDown, ({ button }) => {
      if (button !== "left") return;

      click();
    });

    this.game.on(ClickEvent, (event: ClickEvent) => {
      click(event.auto);
    });
  }

  private startClickEffect(): void {
    const coloredSquare = this.entity._.Border.cast(ColoredSquare);
    if (!coloredSquare) return;

    this.isClicked = true;
    this.effectTimer = 150;

    this.originalScale = this.entity.transform.scale;

    this.entity.transform.scale = {
      x: this.originalScale.x * 0.8,
      y: this.originalScale.y * 0.8,
    };
  }

  onTick(): void {
    if (this.isClicked) {
      const coloredSquare = this.entity._.Border.cast(ColoredSquare);
      if (!coloredSquare) return;

      this.effectTimer -= this.time.delta;
      if (this.effectTimer <= 0) {
        this.entity.transform.scale = this.originalScale;

        this.isClicked = false;
      }
    }
  }
}
