import { Behavior, sync, SyncedUint8Array } from "@dreamlab/engine";

export default class MyBehavior extends Behavior {
  // @sync()
  // myObject: Partial<Record<string, boolean>> = {}

  @sync({ type: SyncedUint8Array })
  myBuffer = new Uint8Array(32);

  override onInitialize(): void {
    if (!this.game.isClient()) return;

    console.log([...this.myBuffer]);
    const idx = Math.floor(Math.random() * 32);
    this.myBuffer[idx] = 255;
    console.log([...this.myBuffer]);
    // this.myObject[this.game.network.self] = true;
    // console.log(this.myObject);
  }
}
