import RAPIER from "../../_deps/rapier_2d.ts";
import type { BaseGameEvents, BaseGameOptions } from "../base_game.ts";
import { BaseGame, DEFAULT_TPS } from "../base_game.ts";
import type { ClientGame } from "../client/client_game.ts";

export interface ServerGameOptions extends BaseGameOptions {
  // TODO: ServerGameOptions
}

export class ServerGame extends BaseGame<BaseGameEvents> {
  public isClient = (): this is ClientGame => false;
  public isServer = (): this is ServerGame => true;

  #interval: number;

  public static async create(options: ServerGameOptions): Promise<ServerGame> {
    await RAPIER.init();
    return new ServerGame(options);
  }

  private constructor(options: ServerGameOptions) {
    super(options);
    const { tps = DEFAULT_TPS } = options;

    this.#interval = setInterval(this.tick.bind(this), 1000 / tps / 2);
    // TODO: Implement ServerGame.constructor()
  }

  public override shutdown(): void {
    clearInterval(this.#interval);
    super.shutdown();
    // TODO: Implement ServerGame.shutdown()
  }
}
