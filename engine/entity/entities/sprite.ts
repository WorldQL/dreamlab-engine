import * as PIXI from "@dreamlab/vendor/pixi.ts";
import { Entity, EntityContext } from "../entity.ts";

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

    // TODO: Listen to change events for transform/value changes
  }

  async onInitialize() {
    if (!this.game.isClient()) return;

    const texture = await PIXI.Assets.load(this.texture.value);
    this.#sprite = new PIXI.Sprite({
      texture,
      width: this.width.value,
      height: this.height.value,
      position: { x: this.transform.position.x, y: -this.transform.position.y },
      rotation: this.transform.rotation,
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
