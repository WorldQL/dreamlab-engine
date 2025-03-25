import { Behavior, syncedValue } from "@dreamlab/engine";

export default class SpinBehavior extends Behavior {
  // in revolutions per second
  @syncedValue()
  speed: number = 1.0;

  override onInitializeClient(): void {
    setTimeout(() => {
      throw new Error("my uncaught error")
    }, 10)
  }

  override onTick(): void {
    if (!this.game.isServer()) return;

    const tau = 2 * Math.PI;
    this.entity.globalTransform.rotation -= this.speed * tau * (this.game.time.delta / 1000.0);
  }
}
