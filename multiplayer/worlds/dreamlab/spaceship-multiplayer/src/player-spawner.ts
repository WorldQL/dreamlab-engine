import { Behavior } from "@dreamlab/engine";

export default class PlayerSpawner extends Behavior {
  onInitialize(): void {
    if (!this.game.isClient()) return;

    const player = this.game.prefabs._.Player.cloneInto(this.game.world, {
      name: "Player." + this.game.network.self,
      transform: { position: { x: 0, y: 0 } },
    });
    player.takeAuthority();
  }
}
