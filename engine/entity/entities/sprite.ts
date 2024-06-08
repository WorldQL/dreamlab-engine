import * as PIXI from "@dreamlab/vendor/pixi.ts";
import { Entity, EntityContext } from "../entity.ts";
import { EntityTransformUpdate } from "../../signals/mod.ts";

export class Sprite extends Entity {
  static readonly WHITE_PNG =
    "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAIAAAACCAYAAABytg0kAAAAAXNSR0IArs4c6QAAAARnQU1BAACxjwv8YQUAAAAJcEhZcwAADsMAAA7DAcdvqGQAAAAUSURBVBhXY/wPBAxAwAQiGBgYGAA9+AQAag6xEAAAAABJRU5ErkJggg==";

  width = this.values.number("width", 1);
  height = this.values.number("height", 1);
  texture = this.values.string("texture", Sprite.WHITE_PNG);

  #sprite: PIXI.Sprite | undefined;

  constructor(ctx: EntityContext) {
    super(ctx);

    PIXI.Assets.backgroundLoad(this.texture.value);

    this.on(EntityTransformUpdate, () => {
      if (!this.#sprite) return;
      this.#sprite.position = {
        x: this.globalTransform.position.x,
        y: -this.globalTransform.position.y,
      };
      this.#sprite.rotation = this.globalTransform.rotation;
      // TODO: update scale
    });
  }

  async onInitialize() {
    if (!this.game.isClient()) return;

    const texture = await PIXI.Assets.load(this.texture.value);
    this.#sprite = new PIXI.Sprite({
      texture,
      width: this.width.value,
      height: this.height.value,
      position: {
        x: this.globalTransform.position.x,
        y: -this.globalTransform.position.y,
      },
      rotation: this.globalTransform.rotation,
      // TODO: Scale (pixi sets the scale based on the desired width/height)
      anchor: 0.5,
    });

    this.game.renderer.scene.addChild(this.#sprite);
  }

  destroy(): void {
    this.#sprite?.destroy();
  }
}
Entity.registerType(Sprite, "@core");
