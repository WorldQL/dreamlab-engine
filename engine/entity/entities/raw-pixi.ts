import { Entity, PixiEntity } from "@dreamlab/engine";
import * as PIXI from "@dreamlab/vendor/pixi.ts";

export class RawPixi extends PixiEntity {
  static {
    Entity.registerType(this, "@core");
  }

  static readonly icon = "🖌️";
  readonly bounds: undefined; // TODO: bounds of gfx, this depends on non-centered bounds support
}

/**
 * @deprecated Use `RawPixi` entity instead
 */
export class RawGraphics extends PixiEntity {
  static {
    Entity.registerType(this, "@core");
  }

  static readonly icon = "🖌️";
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
