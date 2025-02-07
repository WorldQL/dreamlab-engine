import { Behavior } from "@dreamlab/engine";

export default class InduceOOM extends Behavior {
  data: Record<string, string> = {};

  override onTickServer(): void {
    /* const buf1 = new Uint8Array(16);
    const buf2 = new Uint8Array(36);
    for (let i = 0; i < 512; i++) {
      crypto.getRandomValues(buf1);
      crypto.getRandomValues(buf2);
      this.data[encodeBase32(buf1)] = encodeBase64(buf2);
    } */

    if (this.game.time.ticks > 60) {
      const buf1 = new Uint8Array(64);
      while (true) {
        crypto.getRandomValues(buf1);
      }
    }
  }
}
