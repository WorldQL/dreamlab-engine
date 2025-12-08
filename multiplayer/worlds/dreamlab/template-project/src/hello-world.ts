import { Behavior } from "@dreamlab/engine";

export default class HelloWorld extends Behavior {
  onInitialize() {
    console.log("hello world!");
  }

  onTick(): void {
    if (!this.game.isServer()) return;
    this.entity.transform.rotation += 0.01;
  }
}
