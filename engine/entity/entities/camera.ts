import * as PIXI from "@dreamlab/vendor/pixi.ts";
import { Game, ClientGame } from "../../game.ts";
import { Vector2 } from "../../math/mod.ts";
import { GamePreRender } from "../../signals/mod.ts";
import { Entity, EntityContext } from "../entity.ts";
import { smoothLerp } from "../../math/lerp.ts";

export class Camera extends Entity {
  public static METERS_TO_PIXELS = 100;

  public readonly container: PIXI.Container;
  public readonly smooth = this.values.number("smooth", 0.01);

  #position: Vector2 = new Vector2(this.globalTransform.position);
  #rotation: number = this.globalTransform.rotation;
  #scale: Vector2 = new Vector2(this.globalTransform.scale);

  #matrix: PIXI.Matrix = new PIXI.Matrix();
  #updateMatrix() {
    const game = this.game as ClientGame;

    return this.#matrix
      .identity()
      .translate(-this.#position.x, -this.#position.y)
      .rotate(-this.#rotation)
      .scale(Camera.METERS_TO_PIXELS, Camera.METERS_TO_PIXELS)
      .scale(1 / this.#scale.x, 1 / this.#scale.y)
      .translate(game.renderer.app.canvas.width / 2, game.renderer.app.canvas.height / 2);
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

    this.container = new PIXI.Container();
    this.game.renderer.app.stage.addChild(this.container);

    this.listen(this.game, GamePreRender, ({ delta }) => {
      if (!this.#active) return;
      const smooth = this.smooth.value;

      // No smoothing
      if (smooth === 1) {
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
        this.smooth.value,
        delta,
      );

      this.#rotation = smoothLerp(
        this.#rotation,
        this.globalTransform.rotation,
        this.smooth.value,
        delta,
      );

      this.#scale = Vector2.smoothLerp(
        this.#scale,
        this.globalTransform.scale,
        this.smooth.value,
        delta,
      );

      this.container.setFromMatrix(this.#updateMatrix());
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

  public worldToScreen(position: Vector2): Vector2 {
    const { x, y } = this.#matrix.apply({ x: position.x, y: -position.y });
    return new Vector2(x, y);
  }

  public screenToWorld(position: Vector2): Vector2 {
    const { x, y } = this.#matrix.applyInverse(position);
    return new Vector2(x, -y);
  }
}
Entity.registerType(Camera, "@core");
