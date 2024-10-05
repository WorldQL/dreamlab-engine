import * as PIXI from "@dreamlab/vendor/pixi.ts";
import { Entity } from "../entity.ts";
import { PixiEntity } from "../pixi-entity.ts";

export class RawPixi extends PixiEntity {
  static {
    Entity.registerType(this, "@core");
  }

  public static readonly icon = "🎨";
  readonly bounds: undefined; // TODO: bounds of gfx, this depends on non-centered bounds support
}

export class RawGraphics extends PixiEntity {
  static {
    Entity.registerType(this, "@core");
  }

  public static readonly icon = "🖌️";
  readonly bounds: undefined; // TODO: bounds of gfx, this depends on non-centered bounds support

  // TODO: maybe shim this on the server so draw calls are ignored and the type signature can be collapsed
  #gfx: PIXI.Graphics | undefined;
  get gfx(): PIXI.Graphics | undefined {
    return this.#gfx;
  }

  onInitialize() {
    super.onInitialize();
    if (!this.container) return;

    this.#gfx = new PIXI.Graphics();
    this.container.addChild(this.#gfx);
  }
}
