import { Behavior } from "@dreamlab/engine";

export default class SpinBehavior extends Behavior {
  speed = 1.0;

  onInitialize() {
    this.value(SpinBehavior, "speed");
  }

  onTick() {
    this.entity.transform.rotation += this.speed * (Math.PI / this.game.time.TPS);
  }
}
