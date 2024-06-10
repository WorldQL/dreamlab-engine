import { ClientGame } from "../game.ts";
import * as PIXI from "@dreamlab/vendor/pixi.ts";

export class GameRenderer {
  #game: ClientGame;
  app: PIXI.Application;
  scene: PIXI.Container;

  #initialized: boolean = false;

  constructor(game: ClientGame) {
    this.#game = game;

    this.app = new PIXI.Application();
    this.scene = new PIXI.Container();
    this.app.stage.addChild(this.scene);
  }

  async initialize() {
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

  renderFrame() {
    this.app.ticker.update(this.#game.time.now);
    this.app.render();
  }
}
