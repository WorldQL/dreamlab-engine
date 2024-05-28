import RAPIER from "../_deps/rapier_2d.ts";
import { Entity } from "../entity/entity.ts";
import { LocalKeyValue } from "../kv/local.ts";
import { BaseGame, DEFAULT_TPS } from "../runtime/base_game.ts";
import type { ClientGame } from "../runtime/client/client_game.ts";
import type { ServerGame } from "../runtime/server/server_game.ts";

await RAPIER.init();

export const createGame = () => new TestGame();
export class TestGame extends BaseGame {
  public isClient(): this is ClientGame {
    throw new Error("not a real game");
  }

  public isServer(): this is ServerGame {
    throw new Error("not a real game");
  }

  #interval: number;

  public constructor() {
    super({ tps: DEFAULT_TPS, kv: new LocalKeyValue() });
    this.#interval = setInterval(this.tick.bind(this), 1000 / DEFAULT_TPS / 2);
  }

  public override shutdown(): void {
    clearInterval(this.#interval);
    super.shutdown();
  }
}

export class TestEntity extends Entity {
  public destroy(): void {}
}
