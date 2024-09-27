import { Behavior } from "@dreamlab/engine";

export default class SpinBehavior extends Behavior {
  // in revolutions per second
  speed: number = 1.0;

  override setup(): void {
    this.defineValue(SpinBehavior, "speed");
  }

  onTick(): void {
    const tau = 2 * Math.PI;
    this.entity.globalTransform.rotation -= this.speed * tau * (this.game.time.delta / 1000.0);
  }
}
