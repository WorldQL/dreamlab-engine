import { Behavior, Tilemap, value } from "@dreamlab/engine";

export default class GenerateBehavior extends Behavior {
  @value()
  width = 200;
  @value()
  height = 200;

  onInitialize(): void {
    if (!this.game.isServer()) return;

      const then = performance.now();

      const ys = [];
      const xs = [];
      const tileIds = [];

      for (let y = 0; y < this.width; y++) {
        for (let x = 0; x < this.width; x++) {
          ys.push(y);
          xs.push(x);
          tileIds.push(Math.floor(Math.random() * 6));
        }
      }

      this.entity.cast(Tilemap).setTiles(xs, ys, tileIds);

      console.log(`spawned tiles in ${(performance.now() - then).toFixed(3)}ms`)
  }
}
