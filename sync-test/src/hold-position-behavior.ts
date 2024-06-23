import { Behavior } from "@dreamlab/engine";

export default class HoldPosBehavior extends Behavior {
  x = this.values.number("x", 0.0);
  y = this.values.number("y", 0.0);

  onTick(): void {
    this.entity.pos.x = this.x.value;
    this.entity.pos.y = this.y.value;
  }
}
