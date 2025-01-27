import { Behavior } from "@dreamlab/engine";

export default class SpinBehavior extends Behavior {
  speed: number = 1.0;

  onInitialize(): void {
    this.defineValue(SpinBehavior, "speed");
  }

  onTick(): void {
    this.entity.transform.rotation += this.speed * (Math.PI / this.game.time.TPS);
  }
}
