import { Behavior } from "@dreamlab/engine";

export default class PlayerSpawner extends Behavior {
  onInitialize(): void {
    if (!this.game.isClient()) return;

    const newPlayer = this.game.prefabs._.Player.cloneInto(this.game.world, {
      name: "Player." + this.game.network.self,
      authority: this.game.network.self,
    });
    newPlayer._.Sprite.takeAuthority();

    newPlayer.transform.position = { x: 0, y: 0 };
  }
}
