import { Behavior, sync } from "@dreamlab/engine";

export default class MyBehavior extends Behavior {
  // @sync()
  // myObject: Partial<Record<string, boolean>> = {}

  @sync()
  myBuffer = new Uint8Array(32);

  override onInitialize(): void {
    if (!this.game.isClient()) return;

    console.log(this.myBuffer);
    const idx = Math.floor(Math.random() * this.myBuffer.length);
    this.myBuffer[idx] = 255;
    console.log(this.myBuffer);
    // this.myObject[this.game.network.self] = true;
    // console.log(this.myObject);
  }
}
