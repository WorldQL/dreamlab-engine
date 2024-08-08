import { Behavior, PlayerLeft } from "@dreamlab/engine";

export default class CleanupOnLeaveBehavior extends Behavior {
  onInitialize(): void {
    if (!this.game.isServer()) return;
    this.game.on(PlayerLeft, ({ connection }) => {
      if (connection.id !== this.entity.authority) return;
      this.entity.destroy();
    });
  }
}
