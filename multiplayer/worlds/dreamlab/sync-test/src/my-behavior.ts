import { Behavior, sync } from "@dreamlab/engine";

export default class MyBehavior extends Behavior {
  @sync()
  myObject: Partial<Record<string, boolean>> = {}

  override onInitialize(): void {
    if (!this.game.isClient()) return;
    this.myObject[this.game.network.self] = true;
    console.log(this.myObject);
  }
}
