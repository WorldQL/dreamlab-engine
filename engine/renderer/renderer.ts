import { type ClientGame, GameRenderResize } from "@dreamlab/engine";
import * as internal from "@dreamlab/engine/internal";
import * as PIXI from "@dreamlab/vendor/pixi.ts";

export class GameRenderer {
  #game: ClientGame;
  app: PIXI.Application;
  scene: PIXI.Container;

  #initialized: boolean | "pending" = false;
  get initialized(): boolean {
    // coerce pending to false
    return this.#initialized === true;
  }

  constructor(game: ClientGame) {
    this.#game = game;

    this.app = new PIXI.Application();
    this.scene = new PIXI.Container();
    this.app.stage.addChild(this.scene);
  }

  async [internal.rendererInit](): Promise<void> {
    if (this.#initialized === true || this.#initialized === "pending") return;
    this.#initialized = "pending";

    await this.app.init({
      autoDensity: true,
      resizeTo: this.#game.container,
      antialias: true,
      autoStart: false,
      sharedTicker: false,
    });

    this.#game.container.append(this.app.canvas);
    this.#initialized = true;
  }

  [internal.rendererRender](): void {
    this.app.ticker.update(this.#game.time.now);
    this.app.render();
  }

  resize(): void {
    if (this.#initialized !== true) return;

    this.app.resize();
    this.#game.fire(GameRenderResize);
  }
}
