import { Behavior } from "@dreamlab/engine";

export default class SpinBehavior extends Behavior {
  speed: number = 1.0;

  override setup(): void {
    this.defineValue(SpinBehavior, "speed");
  }

  onTick(): void {
    if (!this.game.isServer()) return;
    this.entity.transform.rotation +=
      this.speed * Math.PI * 2 * (this.game.time.delta / 1000.0);
  }
}
