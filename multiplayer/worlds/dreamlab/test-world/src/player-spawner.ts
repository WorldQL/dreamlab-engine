import { Behavior, Sprite2D } from "@dreamlab/engine";
import WASDMovementBehavior from "./wasd.ts";
import CleanupOnLeaveBehavior from "./cleanup-on-leave.ts";

export default class PlayerSpawner extends Behavior {
  onInitialize(): void {
    if (!this.game.isClient()) return;

    const player = this.game.world.spawn({
      type: Sprite2D,
      name: "Player." + this.game.network.self,
      authority: this.game.network.self,
      behaviors: [{ type: WASDMovementBehavior }, { type: CleanupOnLeaveBehavior }],
    });
    player.takeAuthority();
  }
}
