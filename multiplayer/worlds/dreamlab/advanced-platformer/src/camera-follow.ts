import { Behavior, Vector2, syncedValue, lerp } from "@dreamlab/engine";
import PlayerSpawner from "./player-spawner.ts";

export default class CameraFollow extends Behavior {
  @syncedValue()
  public smoothFactor: number = 0.1;

  onPostTick(): void {
    if (!this.game.isClient()) return;

    const target = PlayerSpawner.myLocalPlayer;
    if (!target) return;

    const targetPos = target.globalTransform.position;
    const currentPos = this.entity.transform.position;

    const newPos = new Vector2(
      lerp(currentPos.x, targetPos.x, this.smoothFactor),
      lerp(currentPos.y, targetPos.y + 5, this.smoothFactor),
    );

    this.entity.globalTransform.position = newPos;
  }
}
