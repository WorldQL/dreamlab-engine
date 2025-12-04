import { Behavior } from "@dreamlab/engine";

const SPEED = 1;

export default class SpinBehavior extends Behavior {
  override onTick(): void {
    if (!this.game.isServer()) return;

    const tau = 2 * Math.PI;
    this.entity.globalTransform.rotation -= SPEED * tau * (this.game.time.delta / 1000.0);
  }
}
