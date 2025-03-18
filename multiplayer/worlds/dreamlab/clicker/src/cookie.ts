import { Behavior, ClickableEntity, MouseDown, Sprite } from "@dreamlab/engine";

export default class ClickableColorChanger extends Behavior {
  #clickable: ClickableEntity;
  private isClicked: boolean = false;
  private effectTimer: number = 0;
  private originalScale = { x: 1, y: 1 };

  onInitialize(): void {
    this.#clickable = this.entity.cast(ClickableEntity);

    this.listen(this.#clickable, MouseDown, ({ button }) => {
      if (button !== "left") return;

      const player = this.game.network.connections.find(
        (conn) => conn.id === this.game.network.self,
      );

      if (!player) return;

      this.game.network.sendCustomMessage("server", "@cookie/click", {
        playerId: player.playerId,
        nickname: player.nickname || "Unknown",
      });

      if (!this.isClicked) this.startClickEffect();
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
