import { Behavior } from "../behavior.ts";

export default class SpinBehavior extends Behavior {
  onTick(): void {
    this.entity.transform.rotation += Math.PI / this.game.time.TPS;
  }
}
