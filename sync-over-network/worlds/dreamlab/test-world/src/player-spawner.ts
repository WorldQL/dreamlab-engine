import { Behavior, Sprite2D } from "@dreamlab/engine";

export default class PlayerSpawner extends Behavior {
  onInitialize(): void {
    if (!this.game.isClient()) return;

    void (async () => {
      const WASDMovementBehavior = await this.game.loadBehavior("res://src/wasd.js");
      this.game.world.spawn({
        type: Sprite2D,
        name: "Player." + this.game.network.connectionId,
        authority: this.game.network.connectionId,
        behaviors: [{ type: WASDMovementBehavior }],
      });
    })();
  }
}
