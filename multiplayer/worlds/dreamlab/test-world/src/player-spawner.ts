import { Behavior, Sprite } from "@dreamlab/engine";
import CleanupOnLeaveBehavior from "./cleanup-on-leave.ts";
import WASDMovementBehavior from "./wasd.ts";

export default class PlayerSpawner extends Behavior {
  onInitialize(): void {
    if (!this.game.isClient()) return;

    const player = this.game.world.spawn({
      type: Sprite,
      name: "Player." + this.game.network.self,
      authority: this.game.network.self,
      behaviors: [{ type: WASDMovementBehavior }, { type: CleanupOnLeaveBehavior }],
    });
    player.takeAuthority();
  }
}
