import { Behavior, GameStatus, RawPixi, sync } from "@dreamlab/engine";
import { FillInput, Graphics } from "@dreamlab/vendor/pixi.ts";

function fillStyle(byte: number): FillInput {
  return ["white", "red", "blue", "green", "magenta"][byte % 5]
}

const SIZE = 64;

export default class TileMapBehavior extends Behavior {
  pixi = this.entity.cast(RawPixi);

  // row major: index via HEIGHT * y + x
  @sync()
  data = new Uint8Array(SIZE * SIZE);

  override onInitialize(): void {
    if (!this.game.isClient()) return;

    const gfx = new Graphics();
    this.pixi.container!.addChild(gfx);

    this.redraw(gfx);
    this.getSyncedObject("data").onChanged((_, _from, op) => {
      if (!op) this.redraw(gfx);
      if (op?.t !== "array-set-at") return;

      const y = Math.floor(op.index / SIZE)
      const x = op.index % SIZE;

      gfx.rect(x / SIZE - 0.5, y / SIZE - 0.5, 1 / SIZE, 1 / SIZE).fill(fillStyle(this.data[op.index]));
    });
  }

  override onInitializeServer(): void {
    (async () => {
      const sleep = (n: number) => new Promise((res) => setTimeout(res, n))
      while (this.game.status !== GameStatus.Shutdown) {
        for (let j = 0; j < SIZE / 32; j++) {
          this.data[Math.floor(Math.random() * this.data.length)] = Math.floor(Math.random() * 5);
        }
        await sleep(1000 / 60)
      }
    })();
  }

  redraw(gfx: Graphics) {
    gfx.clear();

    for (let y = 0; y < SIZE; y++) {
      for (let x = 0; x < SIZE; x++) {
        const byte = this.data[SIZE * y + x]
        gfx.rect(x / SIZE - 0.5, y / SIZE - 0.5, 1 / SIZE, 1 / SIZE).fill(fillStyle(byte));
      }
    }
  }
}
