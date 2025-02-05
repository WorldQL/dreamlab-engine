import type { ClientGame } from "@dreamlab/engine";
import { Camera } from "@dreamlab/engine";
import * as internal from "@dreamlab/engine/internal";
import * as PIXI from "@dreamlab/vendor/pixi.ts";

export class GameRenderer {
  #game: ClientGame;
  readonly app: PIXI.Application;
  readonly scene: PIXI.Container;
  readonly screenspace: PIXI.Container;

  #initialized: boolean = false;

  constructor(game: ClientGame) {
    this.#game = game;

    this.app = new PIXI.Application();
    this.scene = new PIXI.Container();
    this.screenspace = new PIXI.Container({ scale: Camera.METERS_TO_PIXELS });

    this.app.stage.addChild(this.scene);
    this.app.stage.addChild(this.screenspace);
  }

  async [internal.rendererInit]() {
    if (this.#initialized) return;
    this.#initialized = true;

    await this.app.init({
      autoDensity: true,
      resizeTo: this.#game.container,
      antialias: true,
      autoStart: false,
      sharedTicker: false,
    });

    this.#game.container.append(this.app.canvas);
  }

  [internal.rendererRender]() {
    this.app.ticker.update(this.#game.time.now);
    this.app.render();
  }
}
