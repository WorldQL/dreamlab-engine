import { Behavior } from "@dreamlab/engine";

export default class HoldPosBehavior extends Behavior {
  x = 0.0;
  y = 0.0;

  onInitialize(): void {
    this.defineValues(HoldPosBehavior, "x", "y");
  }

  onTick(): void {
    this.entity.pos.x = this.x;
    this.entity.pos.y = this.y;
  }
}
