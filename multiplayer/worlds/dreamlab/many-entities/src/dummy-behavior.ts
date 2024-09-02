import { Behavior } from "@dreamlab/engine";

export default class DummyBehavior extends Behavior {
  x = 1;

  onInitialize(): void {
    this.defineValue(DummyBehavior, "x");
  }
}
