import { Behavior, Camera, ClientGame, Empty, Sprite2D } from "@dreamlab/engine";

class PlayerSpawnBehavior extends Behavior {
  onInitialize(): void {
    if (!this.game.isClient()) return;

    void (async () => {
      const WASDMovementBehavior = await this.game.loadBehavior("res://behaviors/wasd.js");
      this.game.world.spawn({
        type: Sprite2D,
        name: "Player." + this.game.network.connectionId,
        authority: this.game.network.connectionId,
        behaviors: [{ type: WASDMovementBehavior }],
      });
    })();
  }
}

export default async (game: ClientGame) => {
  game.local.spawn({
    type: Empty,
    name: "PlayerSpawnManager",
    behaviors: [{ type: PlayerSpawnBehavior }],
  });

  game.local.spawn({
    type: Camera,
    name: "Camera",
  });
};
