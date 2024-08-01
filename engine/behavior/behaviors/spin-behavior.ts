import { Behavior } from "../behavior.ts";

export default class SpinBehavior extends Behavior {
  speed: number = 1.0;

  onInitialize(): void {
    this.value(SpinBehavior, "speed");
  }

  update(): void {
    this.entity.transform.rotation += this.speed * (Math.PI / this.game.time.TPS);
  }
}
