import { Behavior, Collider } from "@dreamlab/engine";
import PlayerController from "./player-controller.ts";

export default class Coin extends Behavior {
  onTickServer(): void {
    const intersecting = this.entity
      // we are attached to a collider, so we cast to it.
      .cast(Collider)
      // get everything intersecting with this Collider
      .getIntersecting()
      // get every intersecting entity's PlayerController
      .filter((e) => e.hasBehavior(PlayerController));

    if (intersecting.length > 0) {
      // get the first player that intersected with the collider and give them a point
      intersecting[0].getBehavior(PlayerController).points++;
      // destroy this coin
      this.entity.destroy();
    }
  }
}
