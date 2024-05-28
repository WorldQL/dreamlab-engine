import { Application, Container } from "../../_deps/pixi.ts";
import RAPIER from "../../_deps/rapier_2d.ts";
import { Camera } from "../../entities/camera.ts";
import { RenderTime } from "../../entity/time.ts";
import type { BaseGameEvents, BaseGameOptions } from "../base_game.ts";
import { BaseGame } from "../base_game.ts";
import type { ServerGame } from "../server/server_game.ts";

export interface ClientGameOptions extends BaseGameOptions {
  readonly container: HTMLDivElement;

  // TODO: ClientGameOptions
}

export type ClientGameEvents = BaseGameEvents & {
  readonly render: [time: RenderTime];
};

export class ClientGame extends BaseGame<ClientGameEvents> {
  public isClient = (): this is ClientGame => true;
  public isServer = (): this is ServerGame => false;

  #cleanupInputs: () => void;
  #container: HTMLDivElement;
  #app: Application<HTMLCanvasElement>;
  #camera: Camera;

  public get container(): HTMLDivElement {
    return this.#container;
  }

  public get app(): Application<HTMLCanvasElement> {
    return this.#app;
  }

  public get stage(): Container {
    return this.#app.stage;
  }

  public get camera(): Camera {
    return this.#camera;
  }

  public static async create(options: ClientGameOptions): Promise<ClientGame> {
    await RAPIER.init();
    return new ClientGame(options);
  }

  private constructor(options: ClientGameOptions) {
    super(options);

    this.#cleanupInputs = this.inputs.registerHandlers();

    this.#container = options.container;
    this.#app = new Application<HTMLCanvasElement>({
      autoDensity: true,
      resizeTo: this.#container,

      antialias: true,
    });

    this.#app.ticker.add(() => {
      const now = performance.now();
      const delta = now - this.time;

      this.tick(now, delta);
    });

    this.#container.append(this.#app.view as HTMLCanvasElement);

    this.#camera = this.createEntity((ctx) => new Camera(ctx));
    // TODO: Implement ClientGame.constructor()
  }

  public override shutdown(): void {
    super.shutdown();

    this.#cleanupInputs();
    this.#app.stop();
    this.#app.destroy(true, { children: true });
    // TODO: Implement ClientGame.shutdown()
  }

  protected tick(now: number, delta: number): void {
    super.tick(now, delta);

    const time: RenderTime = {
      game: this,
      time: now / 1000,
      delta: delta / 1000,
      smooth: this.tickAccumulator / this.tickDelta,
    };

    for (const entity of this.entities) {
      entity.onRender(time);
    }

    this.emit("render", time);
  }
}
