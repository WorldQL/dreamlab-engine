import {
  Behavior,
  CharacterController,
  Entity,
  EntityRef,
  syncedValue,
} from "@dreamlab/engine";

export default class PlayerSpawner extends Behavior {
  public static myLocalPlayer: Entity | undefined = undefined;

  @syncedValue(EntityRef) playerPrefab: Entity;
  @syncedValue(EntityRef) spawnpoint: Entity;
  @syncedValue(EntityRef) playerContainer: Entity;

  onInitialize(): void {
    if (!this.game.isClient()) return;

    const newPlayer = this.playerPrefab.cloneInto(this.playerContainer, {
      name: "Player." + this.game.network.self,
      authority: this.game.network.self,
    });

    newPlayer.globalTransform.position = this.spawnpoint.pos;
    newPlayer.cast(CharacterController).teleport = true;
    PlayerSpawner.myLocalPlayer = newPlayer;
  }
}
