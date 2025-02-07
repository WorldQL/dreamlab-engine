import { CharacterController, Entity } from "@dreamlab/engine";
import { Behavior } from "@dreamlab/engine";

export default class PlayerSpawner extends Behavior {
  public static myLocalPlayer: Entity | undefined = undefined;

  onInitializeClient(): void {
    const newPlayer = this.game.prefabs._.Player.cloneInto(this.game.world._.PlayersContainer, {
      name: "Player." + this.game.network.self,
      authority: this.game.network.self,
    });

    newPlayer.globalTransform.position = this.game.world._.PlayerSpawnpoint.pos;
    // skip collisions for the charactercontroller this tick and just teleport them
    newPlayer.cast(CharacterController).teleport = true;
    PlayerSpawner.myLocalPlayer = newPlayer;
  }
}
