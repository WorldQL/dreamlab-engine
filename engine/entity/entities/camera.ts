import * as PIXI from "@dreamlab/vendor/pixi.ts";
import { ClientGame, Game } from "../../game.ts";
import { smoothLerp } from "../../math/lerp.ts";
import { IVector2, Vector2 } from "../../math/mod.ts";
import { GameRender } from "../../signals/mod.ts";
import { Entity, EntityContext } from "../entity.ts";

export class Camera extends Entity {
  public static readonly icon = "🎥";
  public static METERS_TO_PIXELS = 100;

  public readonly container: PIXI.Container;
  public smooth: number = 0.01;

  #position: Vector2 = new Vector2(this.globalTransform.position);
  #rotation: number = this.globalTransform.rotation;
  #scale: Vector2 = new Vector2(this.globalTransform.scale);

  #matrix: PIXI.Matrix = new PIXI.Matrix();
  #updateMatrix() {
    const game = this.game as ClientGame;

    return this.#matrix
      .identity()
      .translate(-this.#position.x, this.#position.y)
      .rotate(this.#rotation)
      .scale(Camera.METERS_TO_PIXELS, Camera.METERS_TO_PIXELS)
      .scale(1 / this.#scale.x, 1 / this.#scale.y)
      .translate(game.renderer.app.canvas.width / 2, game.renderer.app.canvas.height / 2);
  }

  get smoothed(): {
    readonly position: IVector2;
    readonly rotation: number;
    readonly scale: IVector2;
  } {
    return {
      position: this.#position.bare(),
      rotation: this.#rotation,
      scale: this.#scale.bare(),
    };
  }

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

    // Instantly set smoothed values
    this.#position = new Vector2(this.globalTransform.position);
    this.#rotation = this.globalTransform.rotation;
    this.#scale = new Vector2(this.globalTransform.scale);

    // Reparent scene container
    const game = this.game as ClientGame;
    this.container.addChild(game.renderer.scene);
  }

  // TODO: Look into improving this API maybe?
  public static getActive(game: Game): Camera | undefined {
    return game.entities.lookupByType(Camera).find(camera => camera.active);
  }

  constructor(ctx: EntityContext) {
    super(ctx);

    // Must be a local entity
    if (ctx.parent !== this.game.local || !this.game.isClient()) {
      throw new Error("camera must be spawned as a client local");
    }

    this.value(Camera, "smooth");

    this.container = new PIXI.Container();
    this.game.renderer.app.stage.addChild(this.container);

    this.listen(this.game, GameRender, () => {
      if (!this.#active) return;
      const delta = this.game.time.delta;

      // No smoothing
      if (this.smooth === 1) {
        this.#position.x = this.globalTransform.position.x;
        this.#position.y = this.globalTransform.position.y;
        this.#rotation = this.globalTransform.rotation;
        this.#scale.x = this.globalTransform.scale.x;
        this.#scale.y = this.globalTransform.scale.y;

        this.container.setFromMatrix(this.#updateMatrix());
        return;
      }

      this.#position = Vector2.smoothLerp(
        this.#position,
        this.globalTransform.position,
        this.smooth,
        delta,
      );

      this.#rotation = smoothLerp(
        this.#rotation,
        this.globalTransform.rotation,
        this.smooth,
        delta,
      );

      this.#scale = Vector2.smoothLerp(
        this.#scale,
        this.globalTransform.scale,
        this.smooth,
        delta,
      );

      this.container.setFromMatrix(this.#updateMatrix());
    });

    this.active = true;
  }

  destroy(): void {
    super.destroy();

    const game = this.game as ClientGame;

    // Reparent to pixi root
    game.renderer.app.stage.addChild(game.renderer.scene);
    // Destroy container after
    this.container.destroy();
  }

  public worldToScreen(position: IVector2): Vector2 {
    const { x, y } = this.#matrix.apply({ x: position.x, y: -position.y });
    return new Vector2(x, y);
  }

  public screenToWorld(position: IVector2): Vector2 {
    const { x, y } = this.#matrix.applyInverse(position);
    return new Vector2(x, -y);
  }
}
Entity.registerType(Camera, "@core");
