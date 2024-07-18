import { Behavior } from "@dreamlab/engine";
import { hi } from "./deptest.ts";

export default class SpinBehavior extends Behavior {
  speed: number = 1.0;

  onInitialize() {
    this.value(SpinBehavior, "speed");
  }

  onTick() {
    this.entity.transform.rotation += this.speed * (Math.PI / this.game.time.TPS);
    hi("there!");
  }
}
