import { Behavior, Entity } from "@dreamlab/engine";

export default class PlayerSpawner extends Behavior {
  public static myLocalPlayer: Entity | undefined = undefined;

  onInitialize(): void {
    if (!this.game.isClient()) return;

    const newPlayer = this.game.prefabs._.Player.cloneInto(this.game.world._.PlayersContainer, {
      name: "Player." + this.game.network.self,
      authority: this.game.network.self,
    });

    newPlayer.transform.position = { x: 0, y: 0 };
    PlayerSpawner.myLocalPlayer = newPlayer;
  }
}
