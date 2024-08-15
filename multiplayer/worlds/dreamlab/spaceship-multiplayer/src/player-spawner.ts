import { Behavior } from "@dreamlab/engine";

export default class PlayerSpawner extends Behavior {
  onInitialize(): void {
    if (!this.game.isClient()) return;

    this.game.prefabs._.Player.cloneInto(this.game.world, {
      name: "Player." + this.game.network.self,
      transform: { position: { x: 0, y: 0 } },
      authority: this.game.network.self,
    });

    this.game.local._.Camera.transform.scale.assign({ x: 2, y: 2 });
  }
}
