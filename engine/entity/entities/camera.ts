import * as PIXI from "@dreamlab/vendor/pixi.ts";
import { Game, ClientGame } from "../../game.ts";
import { Vector2 } from "../../math/mod.ts";
import { GamePreRender } from "../../signals/mod.ts";
import { Entity, EntityContext } from "../entity.ts";

export class Camera extends Entity {
  public static METERS_TO_PIXELS = 100;

  // TODO: Smoothed position/rotation/scale
  public readonly container: PIXI.Container;

  #active = false;
  get active(): boolean {
    return this.#active;
  }
  set active(value: boolean) {
    if (!value) {
      this.#active = false;
      return;
    }

    const cameras = this.game.entities.lookupByType(Camera);
    for (const camera of cameras) camera.active = false;
    this.#active = true;
  }

  // TODO: Look into improving this API maybe?
  public static getActive(game: Game): Camera | undefined {
    return game.entities.lookupByType(Camera).find((camera) => camera.active);
  }

  constructor(ctx: EntityContext) {
    super(ctx);

    // Must be a local entity
    if (ctx.parent !== this.game.local || !this.game.isClient()) {
      throw new Error("camera must be spawned as a client local");
    }

    this.container = new PIXI.Container();
    this.container.addChild(this.game.renderer.scene);
    this.game.renderer.app.stage.addChild(this.container);

    this.game.on(GamePreRender, () => {
      this.container.setFromMatrix(this.matrix);
      // TODO: Lerp smoothing for position/rotation/scale
    });

    this.active = true;
  }

  destroy(): void {
    const game = this.game as ClientGame;

    // Reparent to pixi root
    game.renderer.app.stage.addChild(game.renderer.scene);
    // Destroy container after
    this.container.destroy();
  }

  // TODO: Hold this matrix as a class member and react to events to update it
  private get matrix(): PIXI.Matrix {
    const game = this.game as ClientGame;

    return new PIXI.Matrix()
      .translate(
        -this.globalTransform.position.x,
        -this.globalTransform.position.y
      )
      .rotate(-this.globalTransform.rotation)
      .scale(Camera.METERS_TO_PIXELS, Camera.METERS_TO_PIXELS)
      .scale(1 / this.globalTransform.scale.x, 1 / this.globalTransform.scale.y)
      .translate(
        game.renderer.app.canvas.width / 2,
        game.renderer.app.canvas.height / 2
      );
  }

  public worldToScreen(position: Vector2): Vector2 {
    const { x, y } = this.matrix.apply(position);
    return new Vector2(x, y);
  }

  public screenToWorld(position: Vector2): Vector2 {
    const { x, y } = this.matrix.applyInverse(position);
    return new Vector2(x, y);
  }
}
Entity.registerType(Camera, "@core");
