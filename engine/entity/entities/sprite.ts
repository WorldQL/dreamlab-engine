import * as PIXI from "@dreamlab/vendor/pixi.ts";
import { Entity, EntityContext } from "../entity.ts";
import { EntityPreUpdate, GameRender, EntityUpdate } from "../../signals/mod.ts";
import { IVector2, Vector2, lerpAngle } from "../../math/mod.ts";

export class Sprite2D extends Entity {
  public static readonly icon = "🖼️";
  static readonly WHITE_PNG =
    "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAIAAAACCAYAAABytg0kAAAAAXNSR0IArs4c6QAAAARnQU1BAACxjwv8YQUAAAAJcEhZcwAADsMAAA7DAcdvqGQAAAAUSURBVBhXY/wPBAxAwAQiGBgYGAA9+AQAag6xEAAAAABJRU5ErkJggg==";

  width = this.values.number("width", 1);
  height = this.values.number("height", 1);
  texture = this.values.string("texture", Sprite2D.WHITE_PNG);

  #sprite: PIXI.Sprite | undefined;

  #lastRenderPos: IVector2 | undefined;
  #lastRenderRot: number | undefined;

  constructor(ctx: EntityContext) {
    super(ctx);

    PIXI.Assets.backgroundLoad(this.texture.value);

    let prevRenderPos: IVector2 | undefined;
    let prevRenderRot: number | undefined;
    this.on(EntityPreUpdate, () => {
      prevRenderPos = this.globalTransform.position.bare();
      prevRenderRot = this.globalTransform.rotation;
    });
    this.on(EntityUpdate, () => {
      this.#lastRenderPos = prevRenderPos;
      this.#lastRenderRot = prevRenderRot;
    });

    this.listen(this.game, GameRender, () => {
      if (!this.#sprite) return;

      this.#sprite.width = this.width.value * this.globalTransform.scale.x;
      this.#sprite.height = this.height.value * this.globalTransform.scale.y;

      const pos =
        this.#lastRenderPos !== undefined
          ? Vector2.lerp(
              this.#lastRenderPos!,
              this.globalTransform.position,
              this.game.time.partial,
            )
          : this.globalTransform.position;
      const rotation =
        this.#lastRenderRot !== undefined
          ? lerpAngle(
              this.#lastRenderRot!,
              this.globalTransform.rotation,
              this.game.time.partial,
            )
          : this.globalTransform.rotation;

      this.#sprite.position = { x: pos.x, y: -pos.y };
      this.#sprite.rotation = -rotation;
    });
  }

  async onInitialize() {
    if (!this.game.isClient()) return;

    const texture = await PIXI.Assets.load(this.texture.value);
    this.#sprite = new PIXI.Sprite({
      texture,
      width: this.width.value * this.globalTransform.scale.x,
      height: this.height.value * this.globalTransform.scale.y,
      position: {
        x: this.globalTransform.position.x,
        y: -this.globalTransform.position.y,
      },
      rotation: this.globalTransform.rotation,
      anchor: 0.5,
    });

    this.game.renderer.scene.addChild(this.#sprite);
  }

  destroy(): void {
    super.destroy();
    this.#sprite?.destroy();
  }
}
Entity.registerType(Sprite2D, "@core");
