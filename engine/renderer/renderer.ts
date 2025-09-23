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

  async [internal.rendererInit](options: Partial<PIXI.ApplicationOptions> = {}): Promise<void> {
    if (this.#initialized === true || this.#initialized === "pending") return;
    this.#initialized = "pending";

    await this.app.init({
      ...options,
      autoDensity: true,
      resizeTo: this.#game.container,
      antialias: true,
      autoStart: false,
      sharedTicker: false,
      resolution: globalThis.devicePixelRatio,
      backgroundAlpha: 0,
    });

    this.#game.container.append(this.app.canvas);
    this.#initialized = true;
  }

  [internal.rendererRender](): void {
    this.app.ticker.update(this.#game.time.now);
    this.app.render();
  }

  resize(force: boolean = false): void {
    if (this.#initialized !== true) return;

    if (force) {
      this.app.canvas.style.width = "0";
      this.app.canvas.style.height = "0";
      this.app.canvas.width = 0;
      this.app.canvas.height = 0;
    }

    const resizeTo = this.app.resizeTo;
    if (resizeTo instanceof HTMLElement) {
      const { clientWidth: width, clientHeight: height } = resizeTo;
      const res = globalThis.devicePixelRatio;

      this.app.canvas.style.width = `${width}px`;
      this.app.canvas.style.height = `${height}px`;
      this.app.canvas.width = width * res;
      this.app.canvas.height = height * res;

      this.app.renderer.resolution = res;
      this.app.renderer.resize(width, height);
      this.app.render();
    } else {
      this.app.resize();
    }
    this.#game.fire(GameRenderResize);
  }
}
