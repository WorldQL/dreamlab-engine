import * as PIXI from "@dreamlab/vendor/pixi.ts";
import { EntityDestroyed, GameRender } from "../../signals/mod.ts";
import { Entity, EntityContext } from "../entity.ts";
import { InterpolatedEntity } from "../interpolated-entity.ts";
import { TextureAdapter } from "../../value/adapters/texture-adapter.ts";

export class Sprite2D extends InterpolatedEntity {
  public static readonly icon = "🖼️";
  static readonly WHITE_PNG =
    "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAIAAAACCAYAAABytg0kAAAAAXNSR0IArs4c6QAAAARnQU1BAACxjwv8YQUAAAAJcEhZcwAADsMAAA7DAcdvqGQAAAAUSURBVBhXY/wPBAxAwAQiGBgYGAA9+AQAag6xEAAAAABJRU5ErkJggg==";

  width: number = 1;
  height: number = 1;
  texture: string = Sprite2D.WHITE_PNG;

  #sprite: PIXI.Sprite | undefined;

  constructor(ctx: EntityContext) {
    super(ctx);

    this.value(Sprite2D, "width");
    this.value(Sprite2D, "height");
    this.value(Sprite2D, "texture", { type: TextureAdapter });

    PIXI.Assets.backgroundLoad(this.texture);

    this.listen(this.game, GameRender, () => {
      if (!this.#sprite) return;

      this.#sprite.width = this.width * this.globalTransform.scale.x;
      this.#sprite.height = this.height * this.globalTransform.scale.y;

      const pos = this.interpolated.position;
      this.#sprite.position = { x: pos.x, y: -pos.y };
      this.#sprite.rotation = -this.interpolated.rotation;
    });

    this.on(EntityDestroyed, () => {
      this.#sprite?.destroy();
    });
  }

  async onInitialize() {
    if (!this.game.isClient()) return;

    const texture = await PIXI.Assets.load(this.texture);
    this.#sprite = new PIXI.Sprite({
      texture,
      width: this.width * this.globalTransform.scale.x,
      height: this.height * this.globalTransform.scale.y,
      position: {
        x: this.globalTransform.position.x,
        y: -this.globalTransform.position.y,
      },
      rotation: this.globalTransform.rotation,
      anchor: 0.5,
    });

    this.game.renderer.scene.addChild(this.#sprite);
  }
}
Entity.registerType(Sprite2D, "@core");
